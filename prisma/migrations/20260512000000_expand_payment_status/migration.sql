-- PAY-CANONICAL-01-CC Migration
-- Expands PaymentStatus enum to 7 canonical states.
-- ReservationStatus and ExperienceBookingStatus already contain REFUNDED (confirmed in staging DB).
-- No changes required for those two enums.

-- Step 1: Add new PaymentStatus values to the existing enum
ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'DEPOSIT_PAID' AFTER 'PENDING';
ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'PARTIALLY_REFUNDED' AFTER 'PAID';

-- Note: PostgreSQL ALTER TYPE ADD VALUE cannot be run inside a transaction block.
-- Prisma will handle this as a separate statement.
