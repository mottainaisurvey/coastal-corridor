-- AlterTable: add outbound sync tracking fields to Reservation
-- Mirrors the owambeSyncAttempts + owambeSyncError fields on ExperienceBooking (CC-D-01-D)
ALTER TABLE "Reservation" ADD COLUMN "owambeSyncAttempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Reservation" ADD COLUMN "owambeSyncError" TEXT;
