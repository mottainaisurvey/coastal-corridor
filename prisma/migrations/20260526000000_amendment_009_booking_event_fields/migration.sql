-- Amendment 009 — Booking Event Family Fields
-- Additive migration on ExperienceBooking table.
-- 7 new fields:
--   5 Amendment 009 wire shape fields (inboundIdempotencyKey, refundType, refundReason, refundedAt, paystackRefundReference)
--   1 participantUserId nullable (option-a per (item-1) BILATERAL CONCURRENCE 2026-05-26; Owambe-originated bookings have no CC user account at booking.created time)
--   1 guest_details persistence shape (3 separate columns: guestName, guestEmail, guestPhone)
-- All changes are additive-only. No existing data affected. Backward-compatible for existing CC-originated bookings.

-- 1. Make participantUserId nullable (was NOT NULL FK to User)
ALTER TABLE "ExperienceBooking" ALTER COLUMN "participantUserId" DROP NOT NULL;

-- 2. Add inboundIdempotencyKey for dispatch-event-instance idempotency per EP-CC-B3 + Amendment 009 § 4
ALTER TABLE "ExperienceBooking" ADD COLUMN "inboundIdempotencyKey" TEXT;
CREATE UNIQUE INDEX "ExperienceBooking_inboundIdempotencyKey_key" ON "ExperienceBooking"("inboundIdempotencyKey");

-- 3. Add guest_details fields for Owambe-originated bookings (booking.created handler)
ALTER TABLE "ExperienceBooking" ADD COLUMN "guestName" TEXT;
ALTER TABLE "ExperienceBooking" ADD COLUMN "guestEmail" TEXT;
ALTER TABLE "ExperienceBooking" ADD COLUMN "guestPhone" TEXT;

-- 4. Add refund metadata fields per Amendment 009 § 3.3
ALTER TABLE "ExperienceBooking" ADD COLUMN "refundType" TEXT;
ALTER TABLE "ExperienceBooking" ADD COLUMN "refundReason" TEXT;
ALTER TABLE "ExperienceBooking" ADD COLUMN "refundedAt" TIMESTAMP(3);
ALTER TABLE "ExperienceBooking" ADD COLUMN "paystackRefundReference" TEXT;
