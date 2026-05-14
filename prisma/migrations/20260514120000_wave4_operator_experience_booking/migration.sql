-- Wave 4 migration: CC-C-09 + CC-D-01
-- Operator surface, experience booking pipeline, BookingDraft model
-- All operations are purely additive — no DROPs, no type changes, no renames.

-- CreateEnum
CREATE TYPE "BookingDraftStatus" AS ENUM ('DRAFT', 'PENDING_PAYMENT', 'ABANDONED');

-- AlterTable: ExperienceBooking — add payment tracking and Owambe sync fields (CC-D-01-C/D)
ALTER TABLE "ExperienceBooking" ADD COLUMN     "owambeSyncAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "owambeSyncError" TEXT,
ADD COLUMN     "stripePaymentIntentId" TEXT;

-- AlterTable: OperatorApplication — add admin workflow fields (CC-C-09-A)
ALTER TABLE "OperatorApplication" ADD COLUMN     "adminNotes" TEXT,
ADD COLUMN     "clerkInviteId" TEXT,
ADD COLUMN     "cohortMember" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "reviewedBy" TEXT;

-- AlterTable: Reservation — add stripePaymentIntentId for Stripe-paid stays bookings
ALTER TABLE "Reservation" ADD COLUMN     "stripePaymentIntentId" TEXT;

-- CreateTable: BookingDraft — anonymous guest booking state machine (CC-D-01-B)
CREATE TABLE "BookingDraft" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "experienceId" TEXT NOT NULL,
    "timeSlotId" TEXT NOT NULL,
    "status" "BookingDraftStatus" NOT NULL DEFAULT 'DRAFT',
    "groupSize" INTEGER,
    "guestName" TEXT,
    "guestEmail" TEXT,
    "guestPhone" TEXT,
    "totalAmount" DECIMAL(10,2),
    "currency" TEXT,
    "experienceBookingId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookingDraft_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BookingDraft_sessionToken_key" ON "BookingDraft"("sessionToken");

-- CreateIndex
CREATE INDEX "BookingDraft_sessionToken_idx" ON "BookingDraft"("sessionToken");

-- CreateIndex
CREATE INDEX "BookingDraft_experienceId_idx" ON "BookingDraft"("experienceId");

-- CreateIndex
CREATE INDEX "BookingDraft_status_idx" ON "BookingDraft"("status");

-- AddForeignKey
ALTER TABLE "BookingDraft" ADD CONSTRAINT "BookingDraft_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "Experience"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingDraft" ADD CONSTRAINT "BookingDraft_timeSlotId_fkey" FOREIGN KEY ("timeSlotId") REFERENCES "TimeSlot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
