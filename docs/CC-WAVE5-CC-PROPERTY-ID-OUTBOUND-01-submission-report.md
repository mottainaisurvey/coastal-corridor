# CC-WAVE5-CC-PROPERTY-ID-OUTBOUND-01 Submission Report

**Date:** 2026-05-16
**Status:** Complete
**Commit:** `d0d28f9` (on `staging`, to be merged to `main`)

## 1. AC-0 Pre-verification Findings

The AC-0 verification surfaced a critical framing clarification regarding the integration architecture:
- The brief referred to the "outbound payload CC sends to Owambe" for stays reservations.
- Codebase inspection confirmed that the flow direction is **Owambe → CC** (inbound POST to `/api/v1/channel/stays/reservations`).
- The "outbound payload" is therefore the **HTTP 201 response body** that CC returns to Owambe after successfully processing the inbound reservation, not a separate CC-initiated outbound POST.
- This interpretation was confirmed by the founder before proceeding. The fix is a single-line addition to the response body construction.

## 2. Implementation Details (AC-1)

- **File:** `src/app/api/v1/channel/stays/reservations/route.ts`
- **Change:** Added `cc_property_id: property.id` to the 201 response body (line ~228).
- **Position:** Placed immediately after `owambe_reservation_id` for identity-cluster consistency.
- **Uniqueness:** Verified that this is the only code path constructing the stays reservation response payload. The idempotency cache replay path reads the cached response verbatim, so it automatically inherits this change.

## 3. Verification (AC-2)

- **TypeScript:** `npx tsc --noEmit` passed with zero errors in the modified file.
- **Probe Execution:** A live probe was executed against the staging environment (`coastal-corridor-staging-r2t6ds88f-owambe.vercel.app`) using a valid guest user (`owb_probe_guest_cohort_001`).
- **Result:** HTTP 201 Created.

### Verbatim Payload Capture (AC-2b/2d)

The following is the exact HTTP 201 response body returned by CC to Owambe, captured from the live staging probe. This can be used by the parallel thread coordinator to verify the Owambe-side extraction logic.

```json
{
  "id": "cmp90cnkb0005tr5uw4dq4i0h",
  "owambe_reservation_id": "owb_res_ccpid_87176fbd",
  "cc_property_id": "cmp03k1an0009brorx2p72w4s",
  "status": "PENDING",
  "payment_status": "PENDING",
  "channel_commission_amount": "600.00",
  "channel_commission_percent": "12.00",
  "net_to_host": "4400.00",
  "outbound_idempotency_key": "c080b593-1809-450a-b3ae-02bf5c143aa2",
  "created_at": "2026-05-16T23:59:14.508Z"
}
```

## 4. Conclusion

The `cc_property_id` field is now reliably echoed back to Owambe in the reservation creation response. The Owambe-side implementation can safely extract this field from the response body to populate their `ccPropertyId` column.
