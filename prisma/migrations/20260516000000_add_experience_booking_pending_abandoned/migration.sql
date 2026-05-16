-- Migration: 20260516000000_add_experience_booking_pending_abandoned
--
-- Adds PENDING_PAYMENT and ABANDONED to ExperienceBookingStatus enum.
--
-- PENDING_PAYMENT: booking created, payment URL generated, awaiting webhook
-- ABANDONED:       cleanup cron transitions stale PENDING bookings here
--                  (Phase E #37 — cleanup-stale-bookings cron)
--
-- Note: PostgreSQL requires CREATE TYPE ... AS ENUM changes via ALTER TYPE.
-- Prisma shadow DB migration handles the enum extension.

ALTER TYPE "ExperienceBookingStatus" ADD VALUE IF NOT EXISTS 'PENDING_PAYMENT';
ALTER TYPE "ExperienceBookingStatus" ADD VALUE IF NOT EXISTS 'ABANDONED';
