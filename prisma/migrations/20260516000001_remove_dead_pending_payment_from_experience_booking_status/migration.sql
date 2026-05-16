-- Migration: remove dead PENDING_PAYMENT value from ExperienceBookingStatus enum
-- 
-- Context: PENDING_PAYMENT was added to ExperienceBookingStatus in migration
-- 20260516000000 alongside ABANDONED. However, no code path writes PENDING_PAYMENT
-- to ExperienceBooking.status — the ExperienceBooking lifecycle is:
--   (pre-creation) → PENDING → CONFIRMED | ABANDONED
-- PENDING_PAYMENT is semantically correct on BookingDraft (where it already exists
-- from CC-D-01-B), not on ExperienceBooking.
--
-- This migration removes the dead enum value so the schema reflects actual usage.
-- Net final state: ExperienceBookingStatus gains ABANDONED only (correct).

-- Step 1: Ensure no rows use PENDING_PAYMENT (should be zero — value was never written)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "ExperienceBooking" WHERE status = 'PENDING_PAYMENT'
  ) THEN
    RAISE EXCEPTION 'Cannot remove PENDING_PAYMENT: rows exist with this status';
  END IF;
END $$;

-- Step 2: Remove the dead enum value
-- PostgreSQL requires creating a new enum, updating the column, then dropping the old one
ALTER TYPE "ExperienceBookingStatus" RENAME TO "ExperienceBookingStatus_old";
CREATE TYPE "ExperienceBookingStatus" AS ENUM (
  'PENDING',
  'CONFIRMED',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW',
  'REFUNDED',
  'ABANDONED'
);
ALTER TABLE "ExperienceBooking" 
  ALTER COLUMN "status" TYPE "ExperienceBookingStatus" 
  USING "status"::text::"ExperienceBookingStatus";
DROP TYPE "ExperienceBookingStatus_old";
