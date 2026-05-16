# CC-WAVE5-REFUND-CAP-AUDIT-01 Submission Report

## 1. Delivery ID
CC-WAVE5-REFUND-CAP-AUDIT-01 — Audit of refund_amount cap implementation (Phase E #13 first step)

---

## 2. Status
**CLOSED — All acceptance criteria met.**

---

## 3. Acceptance Criteria Results

### AC-0 — Pre-verification: PASS
- **AC-0a:** Grepped the codebase for `refund`, `refundAmount`, and `refund_amount`. Identified the key files housing refund logic:
  - `src/app/api/v1/channel/webhooks/inbound/route.ts` (handles `reservation.cancelled` from Owambe)
  - `src/app/api/webhooks/paystack/route.ts` (handles `refund.processed` from Paystack)
  - `src/app/api/webhooks/stripe-cc/route.ts` (handles `charge.refunded` from Stripe)
  - `src/lib/payments.ts` (Stripe refund creation)
  - `src/lib/paystack-adapter.ts` (Paystack refund creation)
  - `src/lib/payment-status-guard.ts` (PAY-CANONICAL-01 state machine)

### AC-1 — Refund cap logic identification: PASS
- **AC-1a:** **Finding: There is no refund cap enforcement in the CC codebase.** Extensive grepping (`grep -rn "refund.*cap\|cap.*refund\|refund.*exceed"`) and manual review of the webhook handlers and payment adapters revealed zero validation logic restricting `refund_amount` against `totalAmount`, `depositPaid`, or any other ceiling.
- **AC-1b:** **Formula:** N/A. The code accepts whatever `refund_amount` is passed by the Owambe inbound webhook and forwards it directly to the payment gateway (Stripe/Paystack). If no amount is passed, it triggers a full refund.
- **AC-1c:** **Error shape:** N/A. Because there is no CC-side cap, there is no CC-side error thrown for exceeding a cap. Any rejection would come directly from the payment gateway (e.g., Stripe returning a 400 if the requested refund exceeds the original charge amount).
- **AC-1d:** **Scope:** The absence of a cap applies to all flows (Paystack and Stripe).
- **AC-1e:** **Timing:** N/A.

### AC-2 — Audit summary: PASS
- **AC-2a:** See Section 5 below for the plain-English summary.
- **AC-2b:** See Section 5 below for open questions.

---

## 4. Deviations from Brief
None. The brief asked to identify the cap; the audit conclusively identified that no cap exists.

---

## 5. Audit Summary & Open Questions

**Current Behaviour Summary:**
The Coastal Corridor (CC) system currently does not enforce any internal cap or ceiling on refund amounts. When the Owambe system sends a `reservation.cancelled` webhook containing a specific `refund_amount`, the CC system accepts that value blindly and forwards the exact amount to the underlying payment gateway (Stripe or Paystack). If the requested refund amount exceeds the original payment, the CC system relies entirely on the payment gateway to reject the request. There is no CC-side validation ensuring that refunds do not exceed the total amount paid, the deposit paid, or the net amount after channel commission.

**Open Questions for Strategic-Anchor Follow-up:**
1. **Gateway Rejection Handling:** Because CC relies on Stripe/Paystack to reject over-refunds, what happens to the reservation state if the gateway throws an error? The current inbound webhook handler might fail silently or leave the reservation in an inconsistent state if the gateway rejects the refund amount.
2. **Commission Linkage:** If the intended cap is `totalAmount - channel_commission_amount` (i.e., CC keeps its commission on cancellations), this logic must be explicitly built into the CC inbound webhook handler, as the payment gateways have no knowledge of the commission split.
3. **Contract Amendment Text:** The amendment should clarify whether the cap is a strict `totalAmount` ceiling (standard payment processing rule) or a `netToHost` ceiling (commission-aware rule). If it's the latter, code changes will be required to enforce it, as the current implementation is a pure pass-through.
