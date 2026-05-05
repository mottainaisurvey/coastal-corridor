-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('BUYER', 'AGENT', 'DEVELOPER', 'TOUR_OPERATOR', 'ADMIN', 'GOVERNMENT', 'VERIFIER', 'HOST', 'OPERATOR', 'GUEST', 'PARTICIPANT');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('PENDING_VERIFICATION', 'ACTIVE', 'SUSPENDED', 'CLOSED');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('NGN', 'USD', 'GBP');

-- CreateEnum
CREATE TYPE "CohortType" AS ENUM ('COASTAL_CORRIDOR_HOST', 'COASTAL_CORRIDOR_OPERATOR', 'BOTH');

-- CreateEnum
CREATE TYPE "CohortCodeStatus" AS ENUM ('ACTIVE', 'USED', 'REVOKED');

-- CreateEnum
CREATE TYPE "DestinationType" AS ENUM ('INFRASTRUCTURE', 'REAL_ESTATE', 'MIXED_USE', 'TOURISM');

-- CreateEnum
CREATE TYPE "PlotStatus" AS ENUM ('AVAILABLE', 'RESERVED', 'SOLD', 'DISPUTED', 'UNDER_VERIFICATION');

-- CreateEnum
CREATE TYPE "TitleStatus" AS ENUM ('PENDING', 'VERIFIED', 'DISPUTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "TitleType" AS ENUM ('CERTIFICATE_OF_OCCUPANCY', 'DEED_OF_ASSIGNMENT', 'GAZETTE', 'GOVERNOR_CONSENT', 'GLOBAL_C_OF_O', 'CUSTOMARY');

-- CreateEnum
CREATE TYPE "RealEstatePropertyType" AS ENUM ('LAND_ONLY', 'HOUSE', 'APARTMENT', 'COMMERCIAL', 'MIXED_USE', 'HOSPITALITY');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('DRAFT', 'ACTIVE', 'UNDER_OFFER', 'SOLD', 'WITHDRAWN', 'EXPIRED');

-- CreateEnum
CREATE TYPE "InquiryStatus" AS ENUM ('NEW', 'CONTACTED', 'VIEWING_SCHEDULED', 'NEGOTIATING', 'CONVERTED', 'CLOSED_LOST');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('INITIATED', 'ESCROW_FUNDED', 'DOCUMENTS_REVIEW', 'AWAITING_GOVT_CONSENT', 'COMPLETED', 'CANCELLED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "VerificationType" AS ENUM ('FIELD_VISIT', 'TITLE_SEARCH', 'BOUNDARY_CONFIRMATION', 'COMMUNITY_CONSULTATION', 'GOVERNMENT_RECORDS');

-- CreateEnum
CREATE TYPE "VerificationLevel" AS ENUM ('BASIC', 'ENHANCED', 'PREMIUM');

-- CreateEnum
CREATE TYPE "StayPropertyType" AS ENUM ('BEACH_HOUSE', 'GUESTHOUSE', 'HOTEL', 'SERVICED_APARTMENT', 'RESORT', 'HERITAGE', 'OTHER');

-- CreateEnum
CREATE TYPE "StayPropertyStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'UNDER_REVIEW');

-- CreateEnum
CREATE TYPE "RoomType" AS ENUM ('STANDARD', 'DELUXE', 'SUITE', 'FAMILY', 'ENTIRE_PROPERTY', 'OTHER');

-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED', 'NO_SHOW', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'PARTIALLY_PAID', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "ExperienceType" AS ENUM ('TOUR', 'CHARTER', 'WORKSHOP', 'FOOD_EXPERIENCE', 'TRANSPORT', 'EVENT_SPECIALIST', 'WELLNESS', 'OTHER');

-- CreateEnum
CREATE TYPE "ExperienceStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'UNDER_REVIEW');

-- CreateEnum
CREATE TYPE "PricingModel" AS ENUM ('PER_PERSON', 'PER_GROUP', 'TIERED');

-- CreateEnum
CREATE TYPE "TimeSlotStatus" AS ENUM ('OPEN', 'FULL', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ExperienceBookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'REFUNDED');

-- CreateEnum
CREATE TYPE "WebhookDeliveryStatus" AS ENUM ('PENDING', 'DELIVERED', 'FAILED', 'DEAD_LETTER');

-- CreateTable
CREATE TABLE "Config" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "Config_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'BUYER',
    "status" "UserStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "emailVerified" TIMESTAMP(3),
    "phoneVerified" TIMESTAMP(3),
    "kycStatus" TEXT,
    "diasporaCountry" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "preferredCurrency" "Currency" NOT NULL DEFAULT 'NGN',
    "cohortMember" BOOLEAN NOT NULL DEFAULT false,
    "cohortCode" TEXT,
    "cohortType" "CohortType",
    "cohortStartDate" TIMESTAMP(3),
    "cohortEndDate" TIMESTAMP(3),
    "owambeUserId" TEXT,
    "paystackCustomerCode" TEXT,
    "paystackSubaccountCode" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "avatar" TEXT,
    "bio" TEXT,
    "language" TEXT NOT NULL DEFAULT 'en',
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "licenseNumber" TEXT NOT NULL,
    "licenseVerified" BOOLEAN NOT NULL DEFAULT false,
    "licenseExpiry" TIMESTAMP(3),
    "agencyName" TEXT,
    "yearsActive" INTEGER,
    "specialties" TEXT[],
    "regionsCovered" TEXT[],
    "rating" DOUBLE PRECISION,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeveloperProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "cacNumber" TEXT NOT NULL,
    "tin" TEXT,
    "yearFounded" INTEGER,
    "description" TEXT,
    "projectCount" INTEGER NOT NULL DEFAULT 0,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "website" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeveloperProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HostProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "displayName" TEXT,
    "businessName" TEXT,
    "bio" TEXT,
    "commissionRate" DECIMAL(5,4) NOT NULL DEFAULT 0.15,
    "paystackSubaccountCode" TEXT,
    "verificationLevel" "VerificationLevel",
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HostProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OperatorProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "displayName" TEXT,
    "businessName" TEXT,
    "bio" TEXT,
    "commissionRate" DECIMAL(5,4) NOT NULL DEFAULT 0.15,
    "paystackSubaccountCode" TEXT,
    "verificationLevel" "VerificationLevel",
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OperatorProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Destination" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "type" "DestinationType" NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL,
    "heroImage" TEXT,
    "corridorKm" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Destination_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DestinationStat" (
    "id" TEXT NOT NULL,
    "destinationId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "unit" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DestinationStat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PointOfInterest" (
    "id" TEXT NOT NULL,
    "destinationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PointOfInterest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plot" (
    "id" TEXT NOT NULL,
    "plotId" TEXT NOT NULL,
    "destinationId" TEXT NOT NULL,
    "status" "PlotStatus" NOT NULL DEFAULT 'UNDER_VERIFICATION',
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "areaSqm" DOUBLE PRECISION NOT NULL,
    "pricePerSqm" BIGINT NOT NULL,
    "totalPrice" BIGINT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "titleStatus" "TitleStatus" NOT NULL DEFAULT 'PENDING',
    "titleType" "TitleType",
    "titleNumber" TEXT,
    "titleIssuer" TEXT,
    "titleDocumentUrl" TEXT,
    "titleVerifiedAt" TIMESTAMP(3),
    "titleVerifiedBy" TEXT,
    "floodRiskScore" INTEGER,
    "erosionRiskScore" INTEGER,
    "disputeRiskScore" INTEGER,
    "accessibilityScore" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Plot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RealEstateProperty" (
    "id" TEXT NOT NULL,
    "plotId" TEXT NOT NULL,
    "type" "RealEstatePropertyType" NOT NULL,
    "projectId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "bedrooms" INTEGER,
    "bathrooms" INTEGER,
    "floorArea" DOUBLE PRECISION,
    "yearBuilt" INTEGER,
    "amenities" TEXT[],
    "heroImage" TEXT,
    "images" TEXT[],
    "virtualTourUrl" TEXT,
    "floorPlanUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RealEstateProperty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "developerId" TEXT NOT NULL,
    "destinationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "masterplanImage" TEXT,
    "totalUnits" INTEGER NOT NULL,
    "availableUnits" INTEGER NOT NULL,
    "priceFromKobo" BIGINT NOT NULL,
    "priceToKobo" BIGINT NOT NULL,
    "status" TEXT NOT NULL,
    "completionDate" TIMESTAMP(3),
    "amenities" TEXT[],
    "heroImage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Listing" (
    "id" TEXT NOT NULL,
    "status" "ListingStatus" NOT NULL DEFAULT 'DRAFT',
    "plotId" TEXT,
    "propertyId" TEXT,
    "ownerId" TEXT NOT NULL,
    "agentId" TEXT,
    "askingPriceKobo" BIGINT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "negotiable" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT NOT NULL,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "inquiryCount" INTEGER NOT NULL DEFAULT 0,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3),
    "soldAt" TIMESTAMP(3),
    "soldPriceKobo" BIGINT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Listing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedPlot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plotId" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedPlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inquiry" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "plotId" TEXT,
    "userId" TEXT NOT NULL,
    "status" "InquiryStatus" NOT NULL DEFAULT 'NEW',
    "message" TEXT NOT NULL,
    "preferredContactMethod" TEXT NOT NULL DEFAULT 'email',
    "offeredPriceKobo" BIGINT,
    "viewingScheduledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'INITIATED',
    "agreedPriceKobo" BIGINT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "escrowProvider" TEXT,
    "escrowReference" TEXT,
    "escrowFundedAt" TIMESTAMP(3),
    "legalRepUserId" TEXT,
    "docsChecklistJson" TEXT,
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerRef" TEXT NOT NULL,
    "amountKobo" BIGINT NOT NULL,
    "currency" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "method" TEXT,
    "rawProviderJson" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlotVerification" (
    "id" TEXT NOT NULL,
    "plotId" TEXT NOT NULL,
    "type" "VerificationType" NOT NULL,
    "verifierId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "findings" TEXT NOT NULL,
    "photos" TEXT[],
    "gpsLocation" TEXT,
    "videoUrl" TEXT,
    "signedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlotVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TourismListing" (
    "id" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "destinationId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "pricePerNightKobo" BIGINT,
    "capacity" INTEGER,
    "amenities" TEXT[],
    "images" TEXT[],
    "rating" DOUBLE PRECISION,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TourismListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FractionalScheme" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "destinationId" TEXT NOT NULL,
    "totalValueKobo" BIGINT NOT NULL,
    "sharesIssued" INTEGER NOT NULL,
    "sharesAvailable" INTEGER NOT NULL,
    "pricePerShareKobo" BIGINT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "projectedYield" DOUBLE PRECISION NOT NULL,
    "threeYearAppreciation" DOUBLE PRECISION NOT NULL,
    "lockupMonths" INTEGER NOT NULL DEFAULT 36,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "description" TEXT,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FractionalScheme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FractionalShare" (
    "id" TEXT NOT NULL,
    "schemeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "priceKobo" BIGINT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "reference" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "maturesAt" TIMESTAMP(3),

    CONSTRAINT "FractionalShare_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegistryRecord" (
    "id" TEXT NOT NULL,
    "registry" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "plotId" TEXT,
    "rawPayload" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RECEIVED',
    "matchedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegistryRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OperatorApplication" (
    "id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "businessName" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "corridorLocation" TEXT NOT NULL,
    "countryOfResidence" TEXT NOT NULL,
    "propertyType" TEXT,
    "numberOfRooms" INTEGER,
    "currentlyListedOn" TEXT,
    "operationType" TEXT,
    "yearsOperating" INTEGER,
    "annualCustomers" TEXT,
    "aboutOperation" TEXT NOT NULL,
    "whyCoastalCorridor" TEXT,
    "additionalInfo" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "cohortCodeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OperatorApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StayProperty" (
    "id" TEXT NOT NULL,
    "owambePropertyId" TEXT NOT NULL,
    "hostUserId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "propertyType" "StayPropertyType" NOT NULL,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'Nigeria',
    "latitude" DECIMAL(10,7) NOT NULL,
    "longitude" DECIMAL(10,7) NOT NULL,
    "amenities" TEXT[],
    "policies" JSONB NOT NULL,
    "status" "StayPropertyStatus" NOT NULL DEFAULT 'UNDER_REVIEW',
    "verificationLevel" "VerificationLevel",
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StayProperty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Room" (
    "id" TEXT NOT NULL,
    "owambeRoomId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "roomType" "RoomType" NOT NULL,
    "capacity" INTEGER NOT NULL,
    "baseRate" DECIMAL(10,2) NOT NULL,
    "baseCurrency" "Currency" NOT NULL DEFAULT 'NGN',
    "amenities" TEXT[],
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarEntry" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "rate" DECIMAL(10,2),
    "currency" "Currency" NOT NULL DEFAULT 'NGN',
    "minimumStay" INTEGER,
    "maximumStay" INTEGER,
    "closedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reservation" (
    "id" TEXT NOT NULL,
    "owambeReservationId" TEXT,
    "propertyId" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "guestUserId" TEXT NOT NULL,
    "checkInDate" DATE NOT NULL,
    "checkOutDate" DATE NOT NULL,
    "numberOfGuests" INTEGER NOT NULL,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "currency" "Currency" NOT NULL,
    "channelCommissionAmount" DECIMAL(10,2) NOT NULL,
    "channelCommissionPercent" DECIMAL(5,2) NOT NULL,
    "netToHost" DECIMAL(10,2) NOT NULL,
    "damageDeposit" DECIMAL(10,2),
    "specialRequests" TEXT,
    "paystackReference" TEXT,
    "outboundIdempotencyKey" TEXT,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "status" "ReservationStatus" NOT NULL DEFAULT 'PENDING',
    "cancellationReason" TEXT,
    "cancellationInitiatedBy" TEXT,
    "refundAmount" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StayPropertyImage" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StayPropertyImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Experience" (
    "id" TEXT NOT NULL,
    "owambeExperienceId" TEXT NOT NULL,
    "operatorUserId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "experienceType" "ExperienceType" NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "capacity" INTEGER NOT NULL,
    "meetingPointDescription" TEXT NOT NULL,
    "meetingPointLatitude" DECIMAL(10,7) NOT NULL,
    "meetingPointLongitude" DECIMAL(10,7) NOT NULL,
    "pricingModel" "PricingModel" NOT NULL,
    "basePrice" DECIMAL(10,2) NOT NULL,
    "baseCurrency" "Currency" NOT NULL DEFAULT 'NGN',
    "ageRestriction" TEXT,
    "fitnessRequirement" TEXT,
    "weatherDependent" BOOLEAN NOT NULL DEFAULT false,
    "equipmentProvided" TEXT[],
    "equipmentRequired" TEXT[],
    "status" "ExperienceStatus" NOT NULL DEFAULT 'UNDER_REVIEW',
    "verificationLevel" "VerificationLevel",
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Experience_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimeSlot" (
    "id" TEXT NOT NULL,
    "owambeTimeSlotId" TEXT NOT NULL,
    "experienceId" TEXT NOT NULL,
    "startDateTime" TIMESTAMP(3) NOT NULL,
    "endDateTime" TIMESTAMP(3) NOT NULL,
    "capacity" INTEGER NOT NULL,
    "spotsBooked" INTEGER NOT NULL DEFAULT 0,
    "rate" DECIMAL(10,2),
    "currency" "Currency" NOT NULL DEFAULT 'NGN',
    "recurrencePattern" TEXT,
    "status" "TimeSlotStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimeSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExperienceBooking" (
    "id" TEXT NOT NULL,
    "owambeBookingId" TEXT,
    "experienceId" TEXT NOT NULL,
    "timeSlotId" TEXT NOT NULL,
    "participantUserId" TEXT NOT NULL,
    "numberOfParticipants" INTEGER NOT NULL,
    "participantNames" TEXT[],
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "currency" "Currency" NOT NULL,
    "channelCommissionAmount" DECIMAL(10,2) NOT NULL,
    "channelCommissionPercent" DECIMAL(5,2) NOT NULL,
    "netToOperator" DECIMAL(10,2) NOT NULL,
    "specialRequirements" TEXT,
    "pickupRequested" BOOLEAN NOT NULL DEFAULT false,
    "pickupAddress" TEXT,
    "paystackReference" TEXT,
    "outboundIdempotencyKey" TEXT,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "status" "ExperienceBookingStatus" NOT NULL DEFAULT 'PENDING',
    "cancellationReason" TEXT,
    "cancellationInitiatedBy" TEXT,
    "refundAmount" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExperienceBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExperienceImage" (
    "id" TEXT NOT NULL,
    "experienceId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExperienceImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CohortCode" (
    "code" TEXT NOT NULL,
    "cohortType" "CohortType" NOT NULL,
    "status" "CohortCodeStatus" NOT NULL DEFAULT 'ACTIVE',
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "usedByUserId" TEXT,
    "usedAt" TIMESTAMP(3),
    "notes" TEXT,
    "operatorApplicationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CohortCode_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "IdempotencyCache" (
    "id" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "endpointPath" TEXT NOT NULL,
    "bodyHash" TEXT NOT NULL,
    "responseStatus" INTEGER NOT NULL,
    "responseBody" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IdempotencyCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookDelivery" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "targetPlatform" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "signature" TEXT NOT NULL,
    "status" "WebhookDeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastAttemptAt" TIMESTAMP(3),
    "nextAttemptAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebhookDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReconciliationLog" (
    "id" TEXT NOT NULL,
    "runAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scope" TEXT NOT NULL,
    "entitiesChecked" INTEGER NOT NULL,
    "mismatchesFound" INTEGER NOT NULL,
    "autoCorrected" INTEGER NOT NULL,
    "manualReviewItems" INTEGER NOT NULL,
    "details" JSONB NOT NULL,
    "durationMs" INTEGER NOT NULL,

    CONSTRAINT "ReconciliationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "metadata" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkId_key" ON "User"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "User_owambeUserId_key" ON "User"("owambeUserId");

-- CreateIndex
CREATE INDEX "User_role_status_idx" ON "User"("role", "status");

-- CreateIndex
CREATE INDEX "User_diasporaCountry_idx" ON "User"("diasporaCountry");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AgentProfile_userId_key" ON "AgentProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AgentProfile_licenseNumber_key" ON "AgentProfile"("licenseNumber");

-- CreateIndex
CREATE UNIQUE INDEX "DeveloperProfile_userId_key" ON "DeveloperProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DeveloperProfile_cacNumber_key" ON "DeveloperProfile"("cacNumber");

-- CreateIndex
CREATE UNIQUE INDEX "HostProfile_userId_key" ON "HostProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "OperatorProfile_userId_key" ON "OperatorProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Destination_slug_key" ON "Destination"("slug");

-- CreateIndex
CREATE INDEX "Destination_type_idx" ON "Destination"("type");

-- CreateIndex
CREATE INDEX "Destination_state_idx" ON "Destination"("state");

-- CreateIndex
CREATE INDEX "DestinationStat_destinationId_idx" ON "DestinationStat"("destinationId");

-- CreateIndex
CREATE UNIQUE INDEX "Plot_plotId_key" ON "Plot"("plotId");

-- CreateIndex
CREATE INDEX "Plot_destinationId_status_idx" ON "Plot"("destinationId", "status");

-- CreateIndex
CREATE INDEX "Plot_titleStatus_idx" ON "Plot"("titleStatus");

-- CreateIndex
CREATE UNIQUE INDEX "RealEstateProperty_plotId_key" ON "RealEstateProperty"("plotId");

-- CreateIndex
CREATE INDEX "RealEstateProperty_type_idx" ON "RealEstateProperty"("type");

-- CreateIndex
CREATE INDEX "RealEstateProperty_projectId_idx" ON "RealEstateProperty"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "Project_slug_key" ON "Project"("slug");

-- CreateIndex
CREATE INDEX "Project_destinationId_idx" ON "Project"("destinationId");

-- CreateIndex
CREATE INDEX "Project_status_idx" ON "Project"("status");

-- CreateIndex
CREATE INDEX "Listing_status_idx" ON "Listing"("status");

-- CreateIndex
CREATE INDEX "Listing_ownerId_idx" ON "Listing"("ownerId");

-- CreateIndex
CREATE INDEX "Listing_agentId_idx" ON "Listing"("agentId");

-- CreateIndex
CREATE UNIQUE INDEX "SavedPlot_userId_plotId_key" ON "SavedPlot"("userId", "plotId");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_reference_key" ON "Transaction"("reference");

-- CreateIndex
CREATE INDEX "Transaction_status_idx" ON "Transaction"("status");

-- CreateIndex
CREATE INDEX "Transaction_buyerId_idx" ON "Transaction"("buyerId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_providerRef_key" ON "Payment"("providerRef");

-- CreateIndex
CREATE INDEX "PlotVerification_plotId_type_idx" ON "PlotVerification"("plotId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "FractionalScheme_slug_key" ON "FractionalScheme"("slug");

-- CreateIndex
CREATE INDEX "FractionalScheme_destinationId_idx" ON "FractionalScheme"("destinationId");

-- CreateIndex
CREATE INDEX "FractionalScheme_status_idx" ON "FractionalScheme"("status");

-- CreateIndex
CREATE UNIQUE INDEX "FractionalShare_reference_key" ON "FractionalShare"("reference");

-- CreateIndex
CREATE INDEX "FractionalShare_schemeId_idx" ON "FractionalShare"("schemeId");

-- CreateIndex
CREATE INDEX "FractionalShare_userId_idx" ON "FractionalShare"("userId");

-- CreateIndex
CREATE INDEX "RegistryRecord_registry_idx" ON "RegistryRecord"("registry");

-- CreateIndex
CREATE INDEX "RegistryRecord_plotId_idx" ON "RegistryRecord"("plotId");

-- CreateIndex
CREATE UNIQUE INDEX "RegistryRecord_registry_externalId_key" ON "RegistryRecord"("registry", "externalId");

-- CreateIndex
CREATE INDEX "OperatorApplication_status_idx" ON "OperatorApplication"("status");

-- CreateIndex
CREATE INDEX "OperatorApplication_email_idx" ON "OperatorApplication"("email");

-- CreateIndex
CREATE INDEX "OperatorApplication_createdAt_idx" ON "OperatorApplication"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "StayProperty_owambePropertyId_key" ON "StayProperty"("owambePropertyId");

-- CreateIndex
CREATE INDEX "StayProperty_city_state_idx" ON "StayProperty"("city", "state");

-- CreateIndex
CREATE INDEX "StayProperty_latitude_longitude_idx" ON "StayProperty"("latitude", "longitude");

-- CreateIndex
CREATE UNIQUE INDEX "Room_owambeRoomId_key" ON "Room"("owambeRoomId");

-- CreateIndex
CREATE INDEX "CalendarEntry_roomId_date_idx" ON "CalendarEntry"("roomId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "CalendarEntry_roomId_date_key" ON "CalendarEntry"("roomId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Reservation_owambeReservationId_key" ON "Reservation"("owambeReservationId");

-- CreateIndex
CREATE UNIQUE INDEX "Reservation_outboundIdempotencyKey_key" ON "Reservation"("outboundIdempotencyKey");

-- CreateIndex
CREATE INDEX "Reservation_guestUserId_idx" ON "Reservation"("guestUserId");

-- CreateIndex
CREATE INDEX "Reservation_propertyId_checkInDate_checkOutDate_idx" ON "Reservation"("propertyId", "checkInDate", "checkOutDate");

-- CreateIndex
CREATE UNIQUE INDEX "Experience_owambeExperienceId_key" ON "Experience"("owambeExperienceId");

-- CreateIndex
CREATE INDEX "Experience_meetingPointLatitude_meetingPointLongitude_idx" ON "Experience"("meetingPointLatitude", "meetingPointLongitude");

-- CreateIndex
CREATE UNIQUE INDEX "TimeSlot_owambeTimeSlotId_key" ON "TimeSlot"("owambeTimeSlotId");

-- CreateIndex
CREATE INDEX "TimeSlot_experienceId_startDateTime_idx" ON "TimeSlot"("experienceId", "startDateTime");

-- CreateIndex
CREATE UNIQUE INDEX "ExperienceBooking_owambeBookingId_key" ON "ExperienceBooking"("owambeBookingId");

-- CreateIndex
CREATE UNIQUE INDEX "ExperienceBooking_outboundIdempotencyKey_key" ON "ExperienceBooking"("outboundIdempotencyKey");

-- CreateIndex
CREATE INDEX "ExperienceBooking_participantUserId_idx" ON "ExperienceBooking"("participantUserId");

-- CreateIndex
CREATE INDEX "CohortCode_status_idx" ON "CohortCode"("status");

-- CreateIndex
CREATE INDEX "CohortCode_operatorApplicationId_idx" ON "CohortCode"("operatorApplicationId");

-- CreateIndex
CREATE INDEX "IdempotencyCache_expiresAt_idx" ON "IdempotencyCache"("expiresAt");

-- CreateIndex
CREATE INDEX "IdempotencyCache_idempotencyKey_idx" ON "IdempotencyCache"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "WebhookDelivery_eventId_key" ON "WebhookDelivery"("eventId");

-- CreateIndex
CREATE INDEX "WebhookDelivery_status_nextAttemptAt_idx" ON "WebhookDelivery"("status", "nextAttemptAt");

-- CreateIndex
CREATE INDEX "AuditEntry_entityType_entityId_idx" ON "AuditEntry"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditEntry_userId_idx" ON "AuditEntry"("userId");

-- CreateIndex
CREATE INDEX "AuditEntry_createdAt_idx" ON "AuditEntry"("createdAt");

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentProfile" ADD CONSTRAINT "AgentProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeveloperProfile" ADD CONSTRAINT "DeveloperProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostProfile" ADD CONSTRAINT "HostProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperatorProfile" ADD CONSTRAINT "OperatorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DestinationStat" ADD CONSTRAINT "DestinationStat_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "Destination"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointOfInterest" ADD CONSTRAINT "PointOfInterest_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "Destination"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Plot" ADD CONSTRAINT "Plot_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "Destination"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RealEstateProperty" ADD CONSTRAINT "RealEstateProperty_plotId_fkey" FOREIGN KEY ("plotId") REFERENCES "Plot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RealEstateProperty" ADD CONSTRAINT "RealEstateProperty_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_developerId_fkey" FOREIGN KEY ("developerId") REFERENCES "DeveloperProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "Destination"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_plotId_fkey" FOREIGN KEY ("plotId") REFERENCES "Plot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "RealEstateProperty"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "AgentProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedPlot" ADD CONSTRAINT "SavedPlot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedPlot" ADD CONSTRAINT "SavedPlot_plotId_fkey" FOREIGN KEY ("plotId") REFERENCES "Plot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inquiry" ADD CONSTRAINT "Inquiry_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inquiry" ADD CONSTRAINT "Inquiry_plotId_fkey" FOREIGN KEY ("plotId") REFERENCES "Plot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inquiry" ADD CONSTRAINT "Inquiry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlotVerification" ADD CONSTRAINT "PlotVerification_plotId_fkey" FOREIGN KEY ("plotId") REFERENCES "Plot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FractionalScheme" ADD CONSTRAINT "FractionalScheme_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "Destination"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FractionalShare" ADD CONSTRAINT "FractionalShare_schemeId_fkey" FOREIGN KEY ("schemeId") REFERENCES "FractionalScheme"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FractionalShare" ADD CONSTRAINT "FractionalShare_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StayProperty" ADD CONSTRAINT "StayProperty_hostUserId_fkey" FOREIGN KEY ("hostUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "StayProperty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEntry" ADD CONSTRAINT "CalendarEntry_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "StayProperty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_guestUserId_fkey" FOREIGN KEY ("guestUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StayPropertyImage" ADD CONSTRAINT "StayPropertyImage_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "StayProperty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Experience" ADD CONSTRAINT "Experience_operatorUserId_fkey" FOREIGN KEY ("operatorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeSlot" ADD CONSTRAINT "TimeSlot_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "Experience"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExperienceBooking" ADD CONSTRAINT "ExperienceBooking_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "Experience"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExperienceBooking" ADD CONSTRAINT "ExperienceBooking_timeSlotId_fkey" FOREIGN KEY ("timeSlotId") REFERENCES "TimeSlot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExperienceBooking" ADD CONSTRAINT "ExperienceBooking_participantUserId_fkey" FOREIGN KEY ("participantUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExperienceImage" ADD CONSTRAINT "ExperienceImage_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "Experience"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEntry" ADD CONSTRAINT "AuditEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

