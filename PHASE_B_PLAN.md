# Coastal Corridor – Phase B Planning Document (Revised)

This document outlines the architecture, data flow, and implementation steps for Phase B of the Coastal Corridor integration with Owambe. 

Per the Implementation Brief Section 17, Phase B focuses exclusively on **Owambe integration — inbound**. This entails building the inbound API endpoints that allow Owambe to push property, experience, and availability data into the Coastal Corridor system.

## 1. Objectives

1. **Inbound Endpoints:** Implement all inbound endpoints specified in Section 10 of the brief.
2. **Data Synchronization:** Ensure Coastal Corridor can receive and persist property details, experience inventory, and availability updates pushed from Owambe.
3. **Reconciliation:** Implement the snapshot endpoints required for Owambe to verify data consistency.
4. **Security & Reliability:** Apply HMAC verification, idempotency checks, and transactional database operations to all endpoints.

## 2. API Contract: Inbound Endpoints

The following endpoints will be implemented in Phase B, strictly adhering to the OpenAPI specification request/response schemas:

### 2.1 Stays (Properties & Rooms)
- `POST /api/v1/channel/stays/properties` — Register a new property and its rooms.
- `PATCH /api/v1/channel/stays/properties/{id}` — Update property details.
- `DELETE /api/v1/channel/stays/properties/{id}` — Deactivate a property.
- `PUT /api/v1/channel/stays/properties/{id}/availability` — Update room availability (calendar sync).

### 2.2 Experiences (Inventory & Time Slots)
- `POST /api/v1/channel/experiences/inventory` — Register a new experience.
- `PUT /api/v1/channel/experiences/{id}/time-slots` — Update available time slots for an experience.

### 2.3 Webhooks (Already Completed in Phase A)
- `POST /api/v1/channel/webhooks/inbound` — Receive asynchronous event notifications.

### 2.4 Reconciliation
- `GET /api/v1/channel/reconciliation/stays/snapshot` — Provide a snapshot of current stays inventory for Owambe to compare against its source of truth.
- `GET /api/v1/channel/reconciliation/experiences/snapshot` — Provide a snapshot of current experiences inventory.

## 3. Implementation Sequence

The implementation will follow the sequence defined in Section 10 of the brief:

### Step 1: Property & Experience Registration
- Implement `POST /api/v1/channel/stays/properties` and `POST /api/v1/channel/experiences/inventory`.
- **Flow:**
  1. Verify HMAC signature.
  2. Check idempotency key.
  3. Validate payload against OpenAPI schema.
  4. Perform business validation (e.g., check if `owambePropertyId` already exists).
  5. Execute transactional database insert (create `StayProperty` and associated `Room` records).
  6. Return 201 Created with the Coastal Corridor ID.

### Step 2: Availability & Time Slot Updates
- Implement `PUT /api/v1/channel/stays/properties/{id}/availability` and `PUT /api/v1/channel/experiences/{id}/time-slots`.
- **Flow:**
  1. Verify HMAC signature.
  2. Validate payload.
  3. Execute transactional database update (upsert `RoomAvailability` or `TimeSlot` records).
  4. Return 200 OK.

### Step 3: Updates & Deactivations
- Implement `PATCH` and `DELETE` endpoints for properties.

### Step 4: Reconciliation Snapshots
- Implement the `GET` snapshot endpoints.
- **Flow:**
  1. Verify HMAC signature.
  2. Query database for active inventory.
  3. Format response to match the OpenAPI snapshot schema.
  4. Return 200 OK.

## 4. Acceptance Gate

Phase B will be considered complete when:
1. All endpoints are deployed to the operational staging environment.
2. Owambe staging successfully registers a test property and pushes availability to Coastal Corridor staging.
3. Test reservation creation, status updates, and webhook events flow correctly between the two staging environments.
4. The integration passes the Phase B milestone tests defined in Section 16 of the brief.
