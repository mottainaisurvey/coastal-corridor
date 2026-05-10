# Phase E Follow-up Items

Tracked items surfaced during Wave 1 evidence runs that are not blocking Wave 1 closure
but must be addressed before Phase E deliveries (CC-C-08, CC-C-09) land in production.

---

## REG-BUG-01 — Misleading error message on USED cohort codes

**Component:** `POST /api/v1/channel/stays/properties` (registration endpoint)  
**File:** `src/app/api/v1/channel/stays/properties/route.ts`  
**Surfaced:** Wave 1, OWB-C-01 evidence run, May 10 2026  
**Severity:** Medium — obscures debugging; does not affect correctness of the happy path  
**Blocking:** CC-C-08, CC-C-09 (production cohort host onboarding)

### Description

When a cohort code exists in the DB but has `status = 'USED'`, the endpoint currently
returns:

```json
{ "error": "Cohort code not found: CC-G7E0VM4G" }
```

This conflates two distinct failure modes:

1. Code does not exist in the DB at all → `Cohort code not found`
2. Code exists but has already been consumed → `Cohort code already used`

The current message for case 2 is identical to case 1, making it impossible to distinguish
between a typo/wrong code and a legitimately consumed code without a direct DB query.

### Required fix

Split the lookup into two steps:

```typescript
// Step 1: find the code regardless of status
const cohortCode = await prisma.cohortCode.findUnique({ where: { code: payload.cohort_code } });

if (!cohortCode) {
  return NextResponse.json({ error: `Cohort code not found: ${payload.cohort_code}` }, { status: 422 });
}

if (cohortCode.status !== 'ACTIVE') {
  return NextResponse.json(
    { error: `Cohort code ${payload.cohort_code} is not active (status: ${cohortCode.status})` },
    { status: 422 }
  );
}
```

The `USED` case message should be: `"Cohort code already used"` or
`"Cohort code CC-G7E0VM4G is not active (status: USED)"` (the latter is already
the correct message — it just needs the lookup split to reach it correctly).

---

## REG-BUG-02 — Non-atomic cohort code consumption

**Component:** `POST /api/v1/channel/stays/properties` (registration endpoint)  
**File:** `src/app/api/v1/channel/stays/properties/route.ts`  
**Surfaced:** Wave 1, OWB-C-01 evidence run, May 10 2026  
**Severity:** High — data integrity issue; causes permanent cohort code loss on transient failures  
**Blocking:** CC-C-08, CC-C-09 (production cohort host onboarding)

### Description

The current registration flow consumes the cohort code (marks it `USED`, sets `usedByUserId`)
**before** attempting `stayProperty.upsert()`. If property creation fails for any reason
(Prisma validation error, DB constraint violation, network timeout, etc.), the cohort code
is permanently consumed without producing a property.

**Observed during Wave 1:** A `PrismaClientValidationError` on `stayProperty.upsert()` (caused
by an invalid `propertyType` enum value `"APARTMENT"`) consumed cohort code `CC-G7E0VM4G`
permanently. The code had to be manually reset via direct Supabase SQL.

In production, a real cohort host hitting a transient property-creation failure would lose
their cohort code with no recourse, requiring manual admin intervention to reset. This is
an unacceptable user experience for an onboarding flow.

### Required fix

Wrap the entire registration transaction in a Prisma interactive transaction so that cohort
code consumption and property creation succeed together or both roll back:

```typescript
const result = await prisma.$transaction(async (tx) => {
  // 1. Re-validate cohort code inside transaction (prevents TOCTOU race)
  const cohortCode = await tx.cohortCode.findUnique({ where: { code: payload.cohort_code } });
  if (!cohortCode || cohortCode.status !== 'ACTIVE') {
    throw new Error(`Cohort code ${payload.cohort_code} is not available`);
  }

  // 2. Create the host user
  const user = await tx.user.upsert({ ... });

  // 3. Mark cohort code as used
  await tx.cohortCode.update({
    where: { code: payload.cohort_code },
    data: { status: 'USED', usedByUserId: user.id, usedAt: new Date() },
  });

  // 4. Create the property (if this throws, the entire transaction rolls back)
  const property = await tx.stayProperty.upsert({ ... });

  return { user, property };
});
```

This ensures that if step 4 fails, steps 2 and 3 are rolled back automatically.

### Note on user creation

The current flow also creates the `User` record before the property. If the `User` creation
succeeds but property creation fails, the orphaned `User` record is also a concern. The
transaction wrapper above resolves this as well.

---

## RECON-NOTE-01 — Reconciliation snapshot mystery (e2e_prop_a062f6a6)

**Component:** `GET /api/v1/channel/reconciliation/stays/snapshot`  
**Surfaced:** Wave 1, OWB-C-01 evidence run, May 10 2026  
**Severity:** Low — not blocking; no data integrity issue confirmed  
**Status:** Investigated and closed (Owambe-side issue, not CC-side)

### Description

The Owambe developer reported that their reconciliation snapshot at t+0 returned a property
`e2e_prop_a062f6a6 / 'E2E Real Card Test Property'` which does not exist in the CC staging
DB (`wpepjsnqirnskfthzpxp`).

### Investigation findings

1. **CC staging DB (`wpepjsnqirnskfthzpxp`):** `e2e_prop_a062f6a6` does not exist. All 6
   `StayProperty` rows are accounted for and none has this ID or `owambePropertyId`.

2. **Old shared DB (`zpgdjffavjtccyjfshnu`):** `StayProperty` table is empty (0 rows).
   The old DB has 11 `User` rows but no property data.

3. **Reconciliation snapshot endpoint:** Uses `export const dynamic = 'force-dynamic'` —
   no Next.js route caching. Uses `getPrisma()` which reads `process.env.DATABASE_URL` at
   call time — no hardcoded connection string. The endpoint cannot return data that is not
   in `wpepjsnqirnskfthzpxp`.

4. **Conclusion:** The property `e2e_prop_a062f6a6` does not exist in any CC-controlled
   database. The Owambe developer's snapshot result was either:
   - From a stale local mock/fixture in the Owambe adapter test harness, or
   - From a different environment entirely (e.g., an Owambe-internal staging DB that
     mirrors CC data independently).

   This is an Owambe-side data source issue, not a CC-side caching or DB connection issue.

### Action required

None on CC side. The Owambe developer should verify which data source their reconciliation
snapshot query is reading from.

---

## REG-BUG-03 — Misleading 'Property not found' error when property exists but is UNDER_REVIEW

**Component:** `PUT /api/v1/channel/stays/properties/{id}/availability`  
**File:** `src/app/api/v1/channel/stays/properties/[id]/availability/route.ts`  
**Surfaced:** Wave 1, OWB-C-01 evidence run, May 10 2026  
**Severity:** Medium — obscures debugging; same pattern as REG-BUG-01  
**Blocking:** CC-C-08, CC-C-09 (production cohort host onboarding)

### Description

The availability endpoint's property lookup (step 4, line 100) uses:

```typescript
const property = await prisma.stayProperty.findUnique({
  where: { owambePropertyId },
  select: { id: true },
});
if (!property) {
  return NextResponse.json({ error: `Property not found: ${owambePropertyId}` }, { status: 404 });
}
```

There is **no** `status` filter — the endpoint does not restrict to `ACTIVE` properties by
design (Model B: properties accept channel operations from the moment of registration).
However, the 404 `"Property not found"` error message is returned for any lookup failure,
including cases where the `owambePropertyId` is correct but the property is in `UNDER_REVIEW`
or `INACTIVE` state.

**Observed during Wave 1:** The Owambe developer received `404 Property not found` after
successful registration. Investigation confirmed the property existed in the DB with
`status = UNDER_REVIEW`. The actual cause was that the Owambe adapter was passing the
property's internal CUID (`cmp03yfc9000gbror8hviqbd6`) as the `{id}` path parameter instead
of the `owambePropertyId` (`39b80f7d-55ec-467a-bb43-a63063960d04`). The endpoint routes on
`owambePropertyId`, not the internal CUID.

This is a **dual issue**:

1. **Owambe adapter bug:** The adapter must use `owambePropertyId` (the UUID returned in the
   registration response as `owambe_property_id`) as the path parameter, not the CC internal
   CUID.

2. **CC error message gap:** Even if the adapter passes the correct `owambePropertyId`, if a
   property is in `UNDER_REVIEW` state and the endpoint were to add a status filter in future,
   the error message should distinguish:
   - `"Property not found"` → `owambePropertyId` does not exist in DB
   - `"Property not available (status: UNDER_REVIEW)"` → property exists but cannot accept
     the operation

### Required fix (CC side)

No code change required for the current implementation — the endpoint correctly accepts
`UNDER_REVIEW` properties. The error message issue is a pre-emptive fix for future
status-gated variants:

If a status filter is ever added, split the lookup:

```typescript
// Step 1: find regardless of status
const property = await prisma.stayProperty.findUnique({
  where: { owambePropertyId },
  select: { id: true, status: true },
});
if (!property) {
  return NextResponse.json({ error: `Property not found: ${owambePropertyId}` }, { status: 404 });
}
// Step 2: check status if a filter is required
if (property.status !== 'ACTIVE') {
  return NextResponse.json(
    { error: `Property not available (status: ${property.status})` },
    { status: 422 }
  );
}
```

### Required fix (Owambe side)

The Owambe adapter must use the `owambe_property_id` field from the registration response
as the `{id}` path parameter for all subsequent channel operations (availability, rooms, etc.),
not the CC internal CUID.

---

## AVAIL-NOTE-01 — Availability endpoint design model clarification

**Component:** `PUT /api/v1/channel/stays/properties/{id}/availability`  
**Surfaced:** Wave 1, OWB-C-01 evidence run, May 10 2026  
**Status:** Investigated and closed — no code change required

### Findings

The availability endpoint does **not** have an ACTIVE-only filter. The `findUnique` at
`src/app/api/v1/channel/stays/properties/[id]/availability/route.ts:100` queries on
`owambePropertyId` with no `status` condition. This is **Model B** by implementation:
properties accept channel operations (availability writes) from the moment of registration,
regardless of approval status.

This is the correct model for the CC channel API. Properties in `UNDER_REVIEW` state can
receive availability data from Owambe; the data is stored and will be surfaced in guest
search once the property is approved (`status → ACTIVE`).

The contract documentation (`API.md`) should be updated to clarify this explicitly:
availability writes are accepted for properties in any status (`UNDER_REVIEW`, `ACTIVE`,
`INACTIVE`). This prevents future confusion during onboarding flows.

### Action required

Add a note to `API.md` under the availability endpoint documentation clarifying that
`UNDER_REVIEW` properties accept availability writes.
