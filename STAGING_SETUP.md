# Coastal Corridor – Staging Environment & CI/CD Setup

This document outlines the staging environment configuration and CI/CD pipeline instructions for the Coastal Corridor integration with Owambe (Phase A).

## 1. Environment Variables

The staging environment requires the following environment variables to be configured securely (e.g., via Vercel Environment Variables, AWS Secrets Manager, or GitHub Secrets).

### 1.1 Database
- `DATABASE_URL`: Connection string for the staging PostgreSQL database (must include `pgbouncer=true` if using connection pooling).
- `DIRECT_URL`: Direct connection string for Prisma migrations.

### 1.2 Owambe Integration
- `OWAMBE_API_URL`: The base URL for the Owambe staging API (e.g., `https://staging-api.owambe.com`).
- `OWAMBE_SIGNING_SECRET`: The 32-byte hex secret used to sign outbound requests to Owambe (generates `X-CC-Signature`).
- `OWAMBE_WEBHOOK_SECRET`: The 32-byte hex secret used to verify inbound webhooks from Owambe (verifies `X-Owambe-Signature`).

### 1.3 Paystack Integration
- `PAYSTACK_SECRET_KEY`: The Paystack test secret key (starts with `sk_test_`).
- `PAYSTACK_PUBLIC_KEY`: The Paystack test public key (starts with `pk_test_`).

## 2. Database Migrations

Before deploying the application, ensure the staging database schema is up to date.

1. Run Prisma migrations against the staging database:
   ```bash
   npx prisma migrate deploy
   ```
2. Generate the Prisma client:
   ```bash
   npx prisma generate
   ```

## 3. CI/CD Pipeline Instructions

The CI/CD pipeline (e.g., GitHub Actions) should be configured to run the following steps on every push to the `staging` or `main` branches.

### 3.1 Build and Test Workflow

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, staging ]
  pull_request:
    branches: [ main, staging ]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Generate Prisma Client
        run: npx prisma generate

      - name: Run Unit and Integration Tests
        run: pnpm test
        env:
          # Dummy secrets for testing
          OWAMBE_SIGNING_SECRET: test-outbound-secret-32-bytes-ok!
          OWAMBE_WEBHOOK_SECRET: test-inbound-webhook-secret-32b!
          PAYSTACK_SECRET_KEY: sk_test_paystack_secret_key_abc123

      - name: Build Application
        run: pnpm build
```

### 3.2 Deployment

If using Vercel, the deployment is handled automatically upon a successful build. Ensure the environment variables listed in Section 1 are configured in the Vercel dashboard for the staging environment.

If deploying to AWS or another provider, add a deployment step to the CI/CD pipeline that triggers after the `build-and-test` job succeeds.

## 4. Webhook Configuration

After deploying to staging, configure the webhook endpoints in the Owambe and Paystack dashboards.

### 4.1 Owambe Webhooks
- **Endpoint URL:** `https://staging.coastalcorridor.com/api/v1/channel/webhooks/inbound`
- **Events to Subscribe:**
  - `reservation.confirmed`
  - `reservation.cancelled`
  - `reservation.checked_in`
  - `reservation.checked_out`
  - `booking.confirmed`
  - `booking.cancelled`
  - `booking.completed`
  - `property.updated`
  - `property.deactivated`
  - `experience.updated`
  - `experience.deactivated`
  - `availability.updated`

### 4.2 Paystack Webhooks
- **Endpoint URL:** `https://staging.coastalcorridor.com/api/webhooks/paystack`
- **Events to Subscribe:**
  - `charge.success`
  - `refund.processed`
  - `refund.failed`

## 5. Verification

Once deployed, verify the staging environment by:
1. Triggering a test webhook from the Owambe dashboard and confirming a `200 OK` response.
2. Initiating a test transaction via Paystack and verifying the webhook is received and processed.
3. Checking the application logs for any errors related to missing environment variables or database connection issues.

<!-- ci: trigger run #28 - new staging DB -->
