/**
 * host-profile.ts — CC-C-08-A / CC-C-08-D-1 / CC-C-08-D-2
 *
 * Idempotent HostProfile provisioning helper.
 *
 * Usage:
 *   // DB-driven cohort resolution (reads User.cohortMember)
 *   const profile = await ensureHostProfile(userId, db);
 *
 *   // Invitation-driven cohort resolution (from Clerk publicMetadata)
 *   const profile = await ensureHostProfile(userId, db, { cohortMemberOverride: true });
 *
 * Returns the existing HostProfile if one already exists for the given userId,
 * or creates a new one with cohort-aware commissionRate and returns it.
 * Safe to call multiple times — will never create duplicate records.
 *
 * AC-1 (CC-C-08-A):   idempotent provisioning helper
 * AC-2 (CC-C-08-D-1): cohort-aware commissionRate at creation time
 *                     User.cohortMember=true  → commissionRate = 0.12
 *                     User.cohortMember=false/null → commissionRate = 0.15
 * AC-5 (CC-C-08-D-2): cohortMemberOverride — when the Clerk invitation carries
 *                     publicMetadata.cohortMember, the webhook passes it here
 *                     directly rather than relying on User.cohortMember (which
 *                     may not yet be set at the time of user.created).
 */
import { Decimal } from '@prisma/client/runtime/library';
import type { PrismaClient, HostProfile } from '@prisma/client';

/** Cohort host commission rate per the for-operators contract */
const COHORT_COMMISSION_RATE = new Decimal('0.12');
/** Standard host commission rate */
const STANDARD_COMMISSION_RATE = new Decimal('0.15');

export interface EnsureHostProfileOptions {
  /**
   * When provided, overrides the User.cohortMember DB lookup for commissionRate
   * resolution. Use this when the cohort status is known from the Clerk invitation
   * publicMetadata (CC-C-08-D-2 approve flow) rather than from the DB.
   *
   * If undefined, the helper falls back to reading User.cohortMember from the DB.
   */
  cohortMemberOverride?: boolean;
}

/**
 * Ensures a HostProfile exists for the given userId.
 *
 * CommissionRate resolution priority:
 *   1. options.cohortMemberOverride (if provided) — from Clerk invitation metadata
 *   2. User.cohortMember DB field — fallback for direct sign-up and admin role assignment
 *   3. Standard rate (0.15) — if neither is available
 *
 * Existing HostProfile records are NOT modified — this helper is idempotent
 * for existing records. Commission rate backfill for existing records is
 * handled by scripts/backfill-host-profile-commission-rates.ts (CC-C-08-D-1).
 *
 * @param userId  - The CC User.id (not Clerk userId) of the host
 * @param db      - An initialised PrismaClient instance
 * @param options - Optional: cohortMemberOverride from Clerk invitation metadata
 * @returns       The existing or newly-created HostProfile
 */
export async function ensureHostProfile(
  userId: string,
  db: PrismaClient,
  options: EnsureHostProfileOptions = {}
): Promise<HostProfile> {
  // ── 1. Idempotency check ──────────────────────────────────────────────────
  const existing = await db.hostProfile.findUnique({
    where: { userId },
  });
  if (existing) {
    console.log(
      `[ensureHostProfile] existing profile found userId=${userId} ` +
      `id=${existing.id} commissionRate=${existing.commissionRate}`
    );
    return existing;
  }

  // ── 2. Cohort-aware commissionRate resolution ─────────────────────────────
  let isCohortMember: boolean;

  if (typeof options.cohortMemberOverride === 'boolean') {
    // Priority 1: override from Clerk invitation publicMetadata (D-2 approve flow)
    isCohortMember = options.cohortMemberOverride;
    console.log(
      `[ensureHostProfile] cohort resolution: override=${isCohortMember} (from invitation metadata)`
    );
  } else {
    // Priority 2: read from DB User.cohortMember
    // If the User row doesn't exist (edge case: webhook fired before CC User
    // was created), fall back to the standard rate.
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { cohortMember: true },
    });
    isCohortMember = user?.cohortMember === true;
    console.log(
      `[ensureHostProfile] cohort resolution: db.cohortMember=${user?.cohortMember ?? 'null'} → isCohortMember=${isCohortMember}`
    );
  }

  const commissionRate = isCohortMember
    ? COHORT_COMMISSION_RATE    // 0.12 — cohort host
    : STANDARD_COMMISSION_RATE; // 0.15 — standard host

  console.log(
    `[ensureHostProfile] creating new profile userId=${userId} ` +
    `isCohortMember=${isCohortMember} commissionRate=${commissionRate}`
  );

  // ── 3. Create the HostProfile ─────────────────────────────────────────────
  const created = await db.hostProfile.create({
    data: {
      userId,
      commissionRate,
      // All other optional fields (displayName, businessName, bio,
      // paystackSubaccountCode, verificationLevel, verifiedAt) are left null
      // and populated via the settings UI or admin tooling.
    },
  });

  console.log(
    `[ensureHostProfile] new profile created userId=${userId} ` +
    `id=${created.id} commissionRate=${created.commissionRate}`
  );
  return created;
}
