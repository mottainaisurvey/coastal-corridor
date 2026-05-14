/**
 * scripts/backfill-host-profile-commission-rates.ts — CC-C-08-D-1
 *
 * Backfill script: corrects HostProfile.commissionRate values for existing
 * records based on the linked User.cohortMember flag.
 *
 * Backfill logic (per AC-3b):
 *   - HostProfile where User.cohortMember=true  AND commissionRate=0.15:
 *       UPDATE commissionRate → 0.12
 *   - HostProfile where User.cohortMember=false/null AND commissionRate≠0.15:
 *       LOG as anomaly — may be a legitimately negotiated rate; do NOT reset
 *   - All other records: skip (already correct)
 *
 * Idempotent: safe to re-run. A second run will produce 0 changes.
 *
 * Usage:
 *   DATABASE_URL=<url> npx ts-node scripts/backfill-host-profile-commission-rates.ts
 *
 * AC-3 (CC-C-08-D-1): backfill script for existing HostProfile commission rates
 */

import { PrismaClient, Prisma } from '@prisma/client';

const COHORT_RATE = new Prisma.Decimal('0.12');
const STANDARD_RATE = new Prisma.Decimal('0.15');

async function main() {
  const db = new PrismaClient();

  console.log('[backfill-commission-rates] starting...');

  // Fetch all HostProfile records with their linked User cohortMember flag
  const profiles = await db.hostProfile.findMany({
    include: {
      user: {
        select: { id: true, email: true, cohortMember: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  console.log(`[backfill-commission-rates] found ${profiles.length} HostProfile records`);

  let updated = 0;
  let skipped = 0;
  let anomalies = 0;

  for (const profile of profiles) {
    const { id, commissionRate, user } = profile;
    const isCohort = user.cohortMember === true;
    const currentRate = new Prisma.Decimal(commissionRate.toString());

    if (isCohort && currentRate.equals(STANDARD_RATE)) {
      // Cohort host with standard rate → update to cohort rate
      await db.hostProfile.update({
        where: { id },
        data: { commissionRate: COHORT_RATE },
      });
      console.log(
        `[backfill-commission-rates] UPDATED id=${id} userId=${user.id} ` +
        `email=${user.email} cohortMember=true 0.15 → 0.12`
      );
      updated++;
    } else if (!isCohort && !currentRate.equals(STANDARD_RATE)) {
      // Non-cohort host with non-standard rate → anomaly, do not reset
      console.warn(
        `[backfill-commission-rates] ANOMALY id=${id} userId=${user.id} ` +
        `email=${user.email} cohortMember=false/null commissionRate=${currentRate} ` +
        `(may be a negotiated rate — not reset)`
      );
      anomalies++;
    } else {
      // Already correct
      console.log(
        `[backfill-commission-rates] SKIPPED id=${id} userId=${user.id} ` +
        `email=${user.email} cohortMember=${user.cohortMember} commissionRate=${currentRate} (already correct)`
      );
      skipped++;
    }
  }

  console.log('\n[backfill-commission-rates] summary:');
  console.log(`  updated:   ${updated}`);
  console.log(`  skipped:   ${skipped}`);
  console.log(`  anomalies: ${anomalies}`);
  console.log(`  total:     ${profiles.length}`);

  await db.$disconnect();
}

main().catch((err) => {
  console.error('[backfill-commission-rates] fatal error:', err);
  process.exit(1);
});
