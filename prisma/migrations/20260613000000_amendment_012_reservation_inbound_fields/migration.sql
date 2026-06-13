-- Amendment 012 Rev 2 — Reservation Inbound Event Fields
-- Additive migration on Reservation table.
-- 1 new field:
--   inboundIdempotencyKey: dispatch-event-instance idempotency per Amendment 012 § 4
--   (mirrors ExperienceBooking.inboundIdempotencyKey added in Amendment 009)
-- All changes are additive-only. No existing data affected. Backward-compatible.

-- 1. Add inboundIdempotencyKey for dispatch-event-instance idempotency per Amendment 012 § 4
ALTER TABLE "Reservation" ADD COLUMN "inboundIdempotencyKey" TEXT;
CREATE UNIQUE INDEX "Reservation_inboundIdempotencyKey_key" ON "Reservation"("inboundIdempotencyKey");
