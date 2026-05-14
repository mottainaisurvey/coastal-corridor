/**
 * GET /api/diagnostic/db-info — CC-D-01-E-PROBE database split investigation
 *
 * Parses DATABASE_URL (the connection string the Vercel app actually uses at
 * runtime) and returns the host, port, database name, and username (which
 * encodes the Supabase project ID for pooler connections) WITHOUT the password.
 *
 * Also queries the _prisma_migrations table to report which migrations have
 * been applied to this database, and probes for the presence of key tables
 * (BookingDraft, Reservation.stripePaymentIntentId, PaymentStatus enum values)
 * to answer the Wave 2/3/4 migration presence questions.
 *
 * Protected by DIAGNOSTIC_SECRET header (default: 'cc-probe-staging-2026').
 */
import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db-safe';

const DIAGNOSTIC_SECRET = process.env.DIAGNOSTIC_SECRET ?? 'cc-probe-staging-2026';

function parseDbUrl(url: string) {
  try {
    // Handle both postgresql:// and postgres:// schemes
    const normalized = url.replace(/^postgres:\/\//, 'postgresql://');
    const parsed = new URL(normalized);
    return {
      host: parsed.hostname,
      port: parsed.port || '5432',
      database: parsed.pathname.replace(/^\//, ''),
      username: parsed.username, // For Supabase pooler: postgres.[PROJECT_ID]
      // Password intentionally omitted
    };
  } catch {
    return { error: 'Failed to parse DATABASE_URL', raw_length: url.length };
  }
}

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-diagnostic-secret');
  if (secret !== DIAGNOSTIC_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    return NextResponse.json({ error: 'DATABASE_URL not set' }, { status: 503 });
  }

  const connectionInfo = parseDbUrl(dbUrl);

  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json({
      connectionInfo,
      error: 'Prisma client not available',
    }, { status: 503 });
  }

  // Query _prisma_migrations to see which migrations are applied
  let appliedMigrations: { migration_name: string; finished_at: Date | null; applied_steps_count: number }[] = [];
  try {
    appliedMigrations = await prisma.$queryRaw`
      SELECT migration_name, finished_at, applied_steps_count
      FROM _prisma_migrations
      ORDER BY started_at ASC
    `;
  } catch (e) {
    appliedMigrations = [{ migration_name: `ERROR: ${e instanceof Error ? e.message : String(e)}`, finished_at: null, applied_steps_count: 0 }];
  }

  // Probe for BookingDraft table existence (Wave 4)
  let bookingDraftExists = false;
  try {
    await prisma.$queryRaw`SELECT 1 FROM "BookingDraft" LIMIT 1`;
    bookingDraftExists = true;
  } catch {
    bookingDraftExists = false;
  }

  // Probe for stripePaymentIntentId column on Reservation (Wave 2)
  let stripePaymentIntentIdExists = false;
  try {
    await prisma.$queryRaw`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'Reservation' AND column_name = 'stripePaymentIntentId'
    `;
    stripePaymentIntentIdExists = true;
  } catch {
    stripePaymentIntentIdExists = false;
  }

  // Probe for migration 20260512000000_expand_payment_status (PAY-CANONICAL-01)
  // Marker: DEPOSIT_PAID value added to PaymentStatus enum
  let depositPaidEnumExists = false;
  try {
    const result = await prisma.$queryRaw<{ exists: boolean }[]>`
      SELECT EXISTS (
        SELECT 1 FROM pg_enum pe
        JOIN pg_type pt ON pe.enumtypid = pt.oid
        WHERE pt.typname = 'PaymentStatus' AND pe.enumlabel = 'DEPOSIT_PAID'
      ) AS exists
    `;
    depositPaidEnumExists = (result[0] as { exists: boolean })?.exists ?? false;
  } catch {
    depositPaidEnumExists = false;
  }

  // Probe for BookingDraftStatus enum (Wave 4 partial marker — created BEFORE BookingDraft table)
  let bookingDraftStatusEnumExists = false;
  try {
    const result = await prisma.$queryRaw<{ exists: boolean }[]>`
      SELECT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'BookingDraftStatus'
      ) AS exists
    `;
    bookingDraftStatusEnumExists = (result[0] as { exists: boolean })?.exists ?? false;
  } catch {
    bookingDraftStatusEnumExists = false;
  }

  // Probe for OperatorApplication.adminNotes column (Wave 4 ALTER TABLE — before BookingDraft)
  let operatorApplicationAdminNotesExists = false;
  try {
    const result = await prisma.$queryRaw<{ count: number }[]>`
      SELECT COUNT(*) as count FROM information_schema.columns
      WHERE table_name = 'OperatorApplication' AND column_name = 'adminNotes'
    `;
    operatorApplicationAdminNotesExists = Number((result[0] as { count: number })?.count ?? 0) > 0;
  } catch {
    operatorApplicationAdminNotesExists = false;
  }

  // Probe for ExperienceBooking.owambeSyncAttempts column (Wave 4 ALTER TABLE — before BookingDraft)
  let owambeSyncAttemptsExists = false;
  try {
    const result = await prisma.$queryRaw<{ count: number }[]>`
      SELECT COUNT(*) as count FROM information_schema.columns
      WHERE table_name = 'ExperienceBooking' AND column_name = 'owambeSyncAttempts'
    `;
    owambeSyncAttemptsExists = Number((result[0] as { count: number })?.count ?? 0) > 0;
  } catch {
    owambeSyncAttemptsExists = false;
  }

  return NextResponse.json({
    connectionInfo,
    appliedMigrations,
    tableProbes: {
      // Wave 4 markers (migration 20260514120000)
      bookingDraftExists,                    // CREATE TABLE BookingDraft — last step
      bookingDraftStatusEnumExists,          // CREATE TYPE BookingDraftStatus — first step
      operatorApplicationAdminNotesExists,   // ALTER TABLE OperatorApplication — middle step
      owambeSyncAttemptsExists,              // ALTER TABLE ExperienceBooking — first ALTER
      stripePaymentIntentIdExists,           // ALTER TABLE Reservation — middle step
      // PAY-CANONICAL-01 markers (migration 20260512000000)
      depositPaidEnumExists,                 // ALTER TYPE PaymentStatus ADD VALUE DEPOSIT_PAID
    },
  });
}
