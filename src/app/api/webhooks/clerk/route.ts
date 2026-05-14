/**
 * Clerk Webhook Handler — CC-C-08-D-1 / CC-C-08-D-2 / CC-C-09-A
 *
 * Handles Clerk webhook events. Currently subscribes to:
 *   - user.created: provisions HostProfile and/or OperatorProfile based on
 *     the user's role(s) in publicMetadata.
 *
 * CC-C-08-D-2: when the user was admitted via the admin host-applications
 * approve flow, the Clerk invitation carries publicMetadata.cohortMember
 * (boolean). This value is passed to ensureHostProfile / ensureOperatorProfile
 * as cohortMemberOverride, ensuring the correct commissionRate is set at
 * provisioning time regardless of whether User.cohortMember has been populated
 * in the DB yet.
 *
 * CC-C-09-A (AC-2): extended to detect OPERATOR role using getUserRoles
 * (array-safe). For multi-role users (role: ["HOST", "OPERATOR"]), both
 * ensureHostProfile and ensureOperatorProfile fire. Order doesn't matter —
 * both helpers are idempotent.
 *
 * Signature verification uses @clerk/nextjs/webhooks (verifyWebhook),
 * which reads CLERK_WEBHOOK_SIGNING_SECRET from the environment.
 *
 * Deployment prerequisites (see CC-C-08-D-1 delivery report):
 *   1. Register this endpoint in the Clerk Dashboard under Webhooks,
 *      subscribing to the "user.created" event.
 *   2. Copy the signing secret from the Clerk Dashboard and add it to
 *      Vercel env vars as CLERK_WEBHOOK_SIGNING_SECRET.
 *
 * AC-1 (CC-C-08-D-1): Clerk user.created webhook handler
 * AC-2 (CC-C-08-D-1): Cohort-aware HostProfile provisioning via ensureHostProfile
 * AC-5 (CC-C-08-D-2): cohortMemberOverride from invitation publicMetadata
 * AC-2 (CC-C-09-A):   OPERATOR role detection + ensureOperatorProfile
 */
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhook } from '@clerk/nextjs/webhooks';
import type { WebhookEvent } from '@clerk/nextjs/server';
import { getPrismaClient } from '@/lib/db-safe';
import { ensureHostProfile } from '@/lib/host-profile';
import { ensureOperatorProfile } from '@/lib/operator-profile';
import { getUserRoles } from '@/lib/user-roles';

export async function POST(req: NextRequest): Promise<NextResponse> {
  // ── 1. Signature verification ──────────────────────────────────────────────
  let evt: WebhookEvent;
  try {
    evt = await verifyWebhook(req);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[clerk-webhook] signature verification failed:', message);
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
  }

  const eventType = evt.type;
  console.log(`[clerk-webhook] received event type=${eventType} id=${evt.data.id}`);

  // ── 2. Route on event type ─────────────────────────────────────────────────
  if (eventType === 'user.created') {
    return handleUserCreated(evt);
  }

  console.log(`[clerk-webhook] unhandled event type=${eventType} — acknowledged`);
  return NextResponse.json({ received: true }, { status: 200 });
}

// ── Handler: user.created ────────────────────────────────────────────────────

async function handleUserCreated(evt: WebhookEvent): Promise<NextResponse> {
  if (evt.type !== 'user.created') {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const clerkUserId = evt.data.id;
  const publicMetadata = evt.data.public_metadata as Record<string, unknown>;

  // CC-C-09-A-0 / CC-C-09-A: array-safe role normalization.
  // Handles both legacy string form ("HOST") and new array form (["HOST","OPERATOR"]).
  const roles = getUserRoles(publicMetadata);
  const isHost     = roles.some(r => r.toUpperCase() === 'HOST');
  const isOperator = roles.some(r => r.toUpperCase() === 'OPERATOR');

  // CC-C-08-D-2 / CC-C-09-A: cohortMember from Clerk invitation publicMetadata.
  // When an applicant is admitted via /api/admin/host-applications/[id]/approve,
  // the invitation is created with publicMetadata.cohortMember = boolean.
  // Clerk merges invitation publicMetadata into user.publicMetadata on sign-up.
  const cohortMemberFromInvitation: boolean | undefined =
    typeof publicMetadata?.cohortMember === 'boolean'
      ? (publicMetadata.cohortMember as boolean)
      : undefined;

  console.log(
    `[clerk-webhook] user.created clerkUserId=${clerkUserId} roles=${JSON.stringify(roles)} ` +
    `isHost=${isHost} isOperator=${isOperator} cohortMemberFromInvitation=${cohortMemberFromInvitation ?? 'not_set'}`
  );

  // If neither HOST nor OPERATOR role, skip provisioning
  if (!isHost && !isOperator) {
    console.log(`[clerk-webhook] user.created: roles do not include HOST or OPERATOR — no profile provisioned`);
    return NextResponse.json({ received: true, action: 'skipped', reason: 'role_not_host_or_operator' }, { status: 200 });
  }

  // ── DB client ────────────────────────────────────────────────────────────
  const db = getPrismaClient();
  if (!db) {
    console.error('[clerk-webhook] user.created: database not configured');
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  // ── CC User record lookup / creation ─────────────────────────────────────
  // Determine the primary role to store on the CC User row.
  // For multi-role users, HOST takes precedence as the legacy primary role
  // (the User.role field is a single enum; multi-role is expressed via Clerk metadata).
  const primaryRole = isHost ? 'HOST' : 'OPERATOR';

  let ccUser = await db.user.findUnique({ where: { clerkId: clerkUserId } });

  if (!ccUser) {
    const primaryEmailId = evt.data.primary_email_address_id;
    const emailObj = evt.data.email_addresses?.find(
      (e: { id: string; email_address: string }) => e.id === primaryEmailId
    );
    const email = emailObj?.email_address ?? `${clerkUserId}@clerk.placeholder`;

    console.log(`[clerk-webhook] user.created: CC User not found for clerkId=${clerkUserId} — creating with role=${primaryRole}`);

    try {
      ccUser = await db.user.create({
        data: {
          clerkId: clerkUserId,
          email,
          role: primaryRole,
        },
      });
      console.log(`[clerk-webhook] user.created: CC User created id=${ccUser.id} role=${primaryRole}`);
    } catch (createErr) {
      const msg = createErr instanceof Error ? createErr.message : String(createErr);
      console.error(`[clerk-webhook] user.created: failed to create CC User: ${msg}`);
      return NextResponse.json({ error: 'Failed to create CC User record' }, { status: 500 });
    }
  } else {
    console.log(`[clerk-webhook] user.created: CC User found id=${ccUser.id}`);
  }

  // ── Cohort override option (shared between both helpers) ──────────────────
  const cohortOpts = typeof cohortMemberFromInvitation === 'boolean'
    ? { cohortMemberOverride: cohortMemberFromInvitation }
    : {};

  // ── Provision HostProfile if HOST role present ────────────────────────────
  let hostProfileId: string | null = null;
  let hostCommissionRate: string | null = null;

  if (isHost) {
    try {
      const profile = await ensureHostProfile(ccUser.id, db, cohortOpts);
      hostProfileId = profile.id;
      hostCommissionRate = profile.commissionRate?.toString() ?? null;
      console.log(
        `[clerk-webhook] user.created: HostProfile id=${profile.id} ` +
        `commissionRate=${profile.commissionRate} userId=${ccUser.id} ` +
        `cohortOverride=${cohortMemberFromInvitation ?? 'none'}`
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[clerk-webhook] user.created: ensureHostProfile failed: ${msg}`);
      return NextResponse.json({ error: 'HostProfile provisioning failed' }, { status: 500 });
    }
  }

  // ── Provision OperatorProfile if OPERATOR role present ───────────────────
  let operatorProfileId: string | null = null;
  let operatorCommissionRate: string | null = null;

  if (isOperator) {
    try {
      const profile = await ensureOperatorProfile(ccUser.id, db, cohortOpts);
      operatorProfileId = profile.id;
      operatorCommissionRate = profile.commissionRate?.toString() ?? null;
      console.log(
        `[clerk-webhook] user.created: OperatorProfile id=${profile.id} ` +
        `commissionRate=${profile.commissionRate} userId=${ccUser.id} ` +
        `cohortOverride=${cohortMemberFromInvitation ?? 'none'}`
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[clerk-webhook] user.created: ensureOperatorProfile failed: ${msg}`);
      return NextResponse.json({ error: 'OperatorProfile provisioning failed' }, { status: 500 });
    }
  }

  // ── Response ──────────────────────────────────────────────────────────────
  const actions: string[] = [];
  if (hostProfileId)     actions.push('host_profile_provisioned');
  if (operatorProfileId) actions.push('operator_profile_provisioned');

  return NextResponse.json(
    {
      received: true,
      actions,
      ...(hostProfileId     && { hostProfileId,     hostCommissionRate }),
      ...(operatorProfileId && { operatorProfileId, operatorCommissionRate }),
      cohortMember: typeof cohortMemberFromInvitation === 'boolean'
        ? cohortMemberFromInvitation
        : (ccUser as any).cohortMember ?? null,
    },
    { status: 200 }
  );
}
