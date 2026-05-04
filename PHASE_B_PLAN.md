# Coastal Corridor – Phase B Planning Document

This document outlines the architecture, data flow, and implementation steps for Phase B of the Coastal Corridor integration with Owambe. Phase B focuses on **Cohort Onboarding & Calendar Sync**, enabling hosts and operators to join the platform, set up their subaccounts, and synchronize their availability.

## 1. Objectives

1. **Cohort Onboarding:** Implement a secure, invite-only onboarding flow for hosts and operators.
2. **Subaccount Creation:** Automatically create Paystack subaccounts for approved hosts/operators to enable automated commission splitting.
3. **Calendar Sync:** Implement two-way calendar synchronization (iCal/API) between Coastal Corridor and Owambe to prevent double bookings.
4. **Property & Experience Listing:** Allow onboarded hosts to list their properties and experiences on the platform.

## 2. Architecture & Data Flow

### 2.1 Onboarding Flow
1. **Invitation:** Admin generates an invite link with a unique token.
2. **Registration:** Host/Operator clicks the link, fills out their profile (business name, bank details, contact info).
3. **Subaccount Creation:** The backend calls the Paystack API (`createSubaccount`) using the provided bank details.
4. **Profile Activation:** The `paystackSubaccountCode` is saved to the `User` (or `OperatorProfile`) record, and the profile is marked as active.

### 2.2 Calendar Sync Flow
1. **Inbound Sync (Owambe -> CC):**
   - Coastal Corridor listens for `availability.updated` webhooks from Owambe.
   - The webhook handler updates the local `RoomAvailability` or `ExperienceAvailability` records.
2. **Outbound Sync (CC -> Owambe):**
   - When a booking is made directly on Coastal Corridor, the backend sends an outbound request to Owambe's availability API to block the dates.
   - The request is signed using the `OWAMBE_SIGNING_SECRET` (via `signOutboundRequest`).

## 3. Database Schema Updates

The following schema updates will be required in Phase B:

```prisma
// Add to User or OperatorProfile
model User {
  // ... existing fields
  onboardingStatus String @default("PENDING") // PENDING, APPROVED, REJECTED
  inviteToken      String? @unique
}

// New models for Calendar Sync
model RoomAvailability {
  id        String   @id @default(cuid())
  roomId    String
  date      DateTime
  isBlocked Boolean  @default(false)
  source    String   @default("CC") // CC or OWAMBE
  
  room      Room     @relation(fields: [roomId], references: [id])
  
  @@unique([roomId, date])
}
```

## 4. Implementation Steps

### Step 1: Onboarding API & UI
- Create API routes for generating invite tokens (`POST /api/v1/admin/invites`).
- Build the frontend onboarding form for hosts/operators.
- Implement the `POST /api/v1/onboarding/complete` endpoint to handle form submission, call Paystack `createSubaccount`, and update the user profile.

### Step 2: Calendar Sync Engine
- Implement the logic to process `availability.updated` webhooks (currently stubbed in `routeWebhookEvent`).
- Create a background job (e.g., using a cron or queue) to periodically poll Owambe for full calendar syncs (to catch any missed webhooks).
- Implement the outbound API call to Owambe when a local booking is created.

### Step 3: Testing & Verification
- Write unit tests for the onboarding API and calendar sync logic.
- Test the Paystack subaccount creation using test bank accounts.
- Verify two-way calendar sync using a staging Owambe account.

## 5. Security Considerations

- **Invite Tokens:** Must be single-use and expire after a set duration (e.g., 7 days).
- **Bank Details:** Never store full bank account numbers in plain text if possible; rely on Paystack's secure vault and only store the subaccount code.
- **Rate Limiting:** Apply strict rate limiting to the onboarding and calendar sync endpoints to prevent abuse.
