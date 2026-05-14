/**
 * operator-profile.ts — CC-C-09-A
 *
 * Idempotent OperatorProfile provisioning helper.
 *
 * Mirrors the structure of ensureHostProfile (src/lib/host-profile.ts) for the
 * Experiences vertical. Commission rates are DISTINCT from host rates — do not
 * share constants between the two code paths (AC-1b).
 *
 * Usage:
 *   // DB-driven cohort resolution (reads User.cohortMember)
 *   const profile = await ensureOperatorProfile(userId, db);
 *
 *   // Invitation-driven cohort resolution (from Clerk publicMetadata)
 *   const profile = await ensureOperatorProfile(userId, db, { cohortMemberOverride: true });
 *
 * Returns the existing OperatorProfile if one already exists for the given userId,
 * or creates a new one with cohort-aware commissionRate and returns it.
 * Safe to call multiple times — will never create duplicate records.
 *
 * AC-1 (CC-C-09-A):  idempotent provisioning helper
 * AC-1b (CC-C-09-A): operator rates are separate constants from host rates:
 *                    OPERATOR_COHORT_RATE     = 0.15  (cohort operator)
 *                    OPERATOR_STANDARD_RATE   = 0.18  (standard operator)
 *                    cf. HOST_COHORT_RATE=0.12, HOST_STANDARD_RATE=0.15 — the
 *                    0.15 value appears in both rate cards but means different
 *                    things. Separate constants prevent future rate-change
 *                    cross-contamination.
 */
import { Decimal } from '@prisma/client/runtime/library';
import type { PrismaClient, OperatorProfile } from '@prisma/client';

/** Cohort operator commission rate per the for-operators contract */
const OPERATOR_COHORT_RATE = new Decimal('0.15');
/** Standard operator commission rate */
const OPERATOR_STANDARD_RATE = new Decimal('0.18');

export interface EnsureOperatorProfileOptions {
  /**
   * When provided, overrides the User.cohortMember DB lookup for commissionRate
   * resolution. Use this when the cohort status is known from the Clerk invitation
   * publicMetadata (CC-C-09-A approve flow) rather than from the DB.
   *
   * If undefined, the helper falls back to reading User.cohortMember from the DB.
   */
  cohortMemberOverride?: boolean;
}

/**
 * Ensures an OperatorProfile exists for the given userId.
 *
 * CommissionRate resolution priority:
 *   1. options.cohortMemberOverride (if provided) — from Clerk invitation metadata
 *   2. User.cohortMember DB field — fallback for direct sign-up and admin role assignment
 *   3. Standard rate (0.18) — if neither is available
 *
 * Existing OperatorProfile records are NOT modified — this helper is idempotent
 * for existing records.
 *
 * @param userId  - The CC User.id (not Clerk userId) of the operator
 * @param db      - An initialised PrismaClient instance
 * @param options - Optional: cohortMemberOverride from Clerk invitation metadata
 * @returns       The existing or newly-created OperatorProfile
 */
export async function ensureOperatorProfile(
  userId: string,
  db: PrismaClient,
  options: EnsureOperatorProfileOptions = {}
): Promise<OperatorProfile> {
  // ── 1. Idempotency check ──────────────────────────────────────────────────
  const existing = await db.operatorProfile.findUnique({
    where: { userId },
  });
  if (existing) {
    console.log(
      `[ensureOperatorProfile] existing profile found userId=${userId} ` +
      `id=${existing.id} commissionRate=${existing.commissionRate}`
    );
    return existing;
  }

  // ── 2. Cohort-aware commissionRate resolution ─────────────────────────────
  let isCohortMember: boolean;

  if (typeof options.cohortMemberOverride === 'boolean') {
    // Priority 1: override from Clerk invitation publicMetadata (approve flow)
    isCohortMember = options.cohortMemberOverride;
    console.log(
      `[ensureOperatorProfile] cohort resolution: override=${isCohortMember} (from invitation metadata)`
    );
  } else {
    // Priority 2: read from DB User.cohortMember
    // If the User row doesn't exist (edge case: webhook fired before CC User
    // was created), fall back to the standard rate.
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { cohortMember: true },
    });
    isCohortMember = user?.cohortMember === true;
    console.log(
      `[ensureOperatorProfile] cohort resolution: db.cohortMember=${user?.cohortMember ?? 'null'} → isCohortMember=${isCohortMember}`
    );
  }

  const commissionRate = isCohortMember
    ? OPERATOR_COHORT_RATE    // 0.15 — cohort operator
    : OPERATOR_STANDARD_RATE; // 0.18 — standard operator

  console.log(
    `[ensureOperatorProfile] creating new profile userId=${userId} ` +
    `isCohortMember=${isCohortMember} commissionRate=${commissionRate}`
  );

  // ── 3. Create the OperatorProfile ─────────────────────────────────────────
  const created = await db.operatorProfile.create({
    data: {
      userId,
      commissionRate,
      // All other optional fields (displayName, businessName, bio,
      // paystackSubaccountCode, verificationLevel, verifiedAt) are left null
      // and populated via the settings UI or admin tooling.
    },
  });

  console.log(
    `[ensureOperatorProfile] new profile created userId=${userId} ` +
    `id=${created.id} commissionRate=${created.commissionRate}`
  );
  return created;
}
