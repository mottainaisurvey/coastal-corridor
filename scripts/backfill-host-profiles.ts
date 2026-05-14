/**
 * scripts/backfill-host-profiles.ts — CC-C-08-A AC-4
 *
 * One-off backfill script that creates HostProfile records for all existing
 * users with role = 'HOST' who do not already have a HostProfile.
 *
 * Idempotent: running a second time produces 0 new HostProfile records.
 *
 * Usage:
 *   npx ts-node --project tsconfig.json scripts/backfill-host-profiles.ts
 *   (or run via ts-node with DATABASE_URL set in environment)
 *
 * AC-4a: Iterates all users with role = HOST, checks for existing HostProfile,
 *        creates one if missing using the ensureHostProfile helper.
 * AC-4b: Idempotent — second run produces 0 new records.
 * AC-4c: Post-backfill: COUNT(HostProfile) = COUNT(User WHERE role='HOST').
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function backfillHostProfiles(): Promise<void> {
  console.log('[backfill] Starting HostProfile backfill...');

  // Count before
  const beforeCount = await prisma.hostProfile.count();
  const hostUserCount = await prisma.user.count({ where: { role: 'HOST' } });
  console.log(`[backfill] Before: HostProfile=${beforeCount}, Users with role=HOST=${hostUserCount}`);

  // Fetch all HOST users
  const hostUsers = await prisma.user.findMany({
    where: { role: 'HOST' },
    select: { id: true, email: true },
  });

  console.log(`[backfill] Found ${hostUsers.length} HOST user(s) to process`);

  let created = 0;
  let skipped = 0;

  for (const user of hostUsers) {
    const existing = await prisma.hostProfile.findUnique({
      where: { userId: user.id },
    });

    if (existing) {
      console.log(`[backfill]   SKIP  userId=${user.id} email=${user.email} — profile already exists (id=${existing.id})`);
      skipped++;
    } else {
      const profile = await prisma.hostProfile.create({
        data: { userId: user.id },
      });
      console.log(`[backfill]   CREATE userId=${user.id} email=${user.email} — new profile id=${profile.id}`);
      created++;
    }
  }

  // Count after
  const afterCount = await prisma.hostProfile.count();
  console.log(`\n[backfill] Complete.`);
  console.log(`[backfill]   Created:  ${created}`);
  console.log(`[backfill]   Skipped:  ${skipped}`);
  console.log(`[backfill]   After:    HostProfile=${afterCount}, Users with role=HOST=${hostUserCount}`);
  console.log(`[backfill]   Coverage: ${afterCount === hostUserCount ? 'FULL ✓' : `PARTIAL — ${afterCount}/${hostUserCount}`}`);
}

backfillHostProfiles()
  .catch((err) => {
    console.error('[backfill] Fatal error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
