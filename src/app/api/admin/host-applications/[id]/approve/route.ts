export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';

/**
 * POST /api/admin/host-applications/[id]/approve
 *
 * CC-C-08-D-2 — AC-5: Approve a host application.
 * CC-C-09-A  — AC-3: Extended to handle three application paths.
 *
 * Steps:
 *   1. Load the OperatorApplication record; verify it exists and is approvable.
 *   2. Resolve the Clerk invitation role based on application.path:
 *        path='host'     → role: "HOST"             (string — backward compat)
 *        path='operator' → role: "OPERATOR"          (string)
 *        path='both'     → role: ["HOST","OPERATOR"] (array — multi-role)
 *   3. Issue a Clerk invitation to the applicant's email with publicMetadata:
 *        { role: <resolved>, applicationId: id, cohortMember: boolean }
 *      These metadata values are merged into the user's publicMetadata on sign-up,
 *      which the D-1 user.created webhook reads to provision the CC User +
 *      HostProfile and/or OperatorProfile with the correct cohort-aware rate.
 *   4. Update OperatorApplication:
 *        status = 'ACCEPTED'
 *        cohortMember = <from request body>
 *        adminNotes = <from request body>
 *        reviewedBy = admin's Clerk userId
 *        reviewedAt = now()
 *        clerkInviteId = invitation.id
 *
 * Body: { cohortMember: boolean, adminNotes?: string }
 * Auth: ADMIN or SUPERADMIN only.
 *
 * AC-3b: The previous guard `if (!['host','both'].includes(application.path))`
 *        has been removed. All three path values are now accepted.
 * AC-3c: Status workflow unchanged — PENDING → ACCEPTED on approve.
 *        Phase E #23: ADMIN vs SUPERADMIN tier enforcement is out of scope here.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId, sessionClaims } = await auth();
    const role = (sessionClaims?.publicMetadata as any)?.role as string | undefined;
    if (!role || !['ADMIN', 'SUPERADMIN', 'admin', 'superadmin'].includes(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = params;
    const body = await req.json();
    const cohortMember: boolean = body.cohortMember === true;
    const adminNotes: string = typeof body.adminNotes === 'string' ? body.adminNotes.trim() : '';

    // Load the application
    const application = await prisma.operatorApplication.findUnique({
      where: { id },
    });
    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // AC-3b: Accept all three path values; reject unknown paths
    const validPaths = ['host', 'operator', 'both'];
    if (!validPaths.includes(application.path)) {
      return NextResponse.json(
        { error: `Unknown application path: ${application.path}. Expected one of: ${validPaths.join(', ')}` },
        { status: 400 }
      );
    }

    if (application.status === 'ACCEPTED') {
      return NextResponse.json({ error: 'Application is already accepted' }, { status: 409 });
    }

    // AC-3a: Resolve the Clerk invitation role based on application.path
    // path='host'     → role: "HOST"             (string — backward compat for single-role path)
    // path='operator' → role: "OPERATOR"          (string)
    // path='both'     → role: ["HOST","OPERATOR"] (array — multi-role)
    let invitationRole: string | string[];
    if (application.path === 'host') {
      invitationRole = 'HOST';
    } else if (application.path === 'operator') {
      invitationRole = 'OPERATOR';
    } else {
      // path === 'both'
      invitationRole = ['HOST', 'OPERATOR'];
    }

    // Issue Clerk invitation
    // publicMetadata is merged into user.publicMetadata on sign-up.
    // The D-1 user.created webhook reads role + cohortMember to provision
    // HostProfile and/or OperatorProfile with the correct cohort-aware rate.
    const client = await clerkClient();
    const invitation = await client.invitations.createInvitation({
      emailAddress: application.email,
      notify: true,
      ignoreExisting: true,
      publicMetadata: {
        role: invitationRole,
        applicationId: id,
        cohortMember,
      },
    });

    // Update the application record
    const updated = await prisma.operatorApplication.update({
      where: { id },
      data: {
        status: 'ACCEPTED',
        cohortMember,
        adminNotes: adminNotes || null,
        reviewedBy: userId ?? null,
        reviewedAt: new Date(),
        clerkInviteId: invitation.id,
      },
    });

    const profilesNote =
      application.path === 'host'     ? 'HostProfile will be provisioned at sign-up via the D-1 webhook.' :
      application.path === 'operator' ? 'OperatorProfile will be provisioned at sign-up via the D-1 webhook.' :
      'HostProfile and OperatorProfile will both be provisioned at sign-up via the D-1 webhook.';

    return NextResponse.json({
      success: true,
      applicationId: updated.id,
      clerkInviteId: invitation.id,
      email: application.email,
      path: application.path,
      invitationRole,
      cohortMember,
      message: `Invitation sent to ${application.email}. ${profilesNote}`,
    });
  } catch (error: any) {
    console.error('[POST /api/admin/host-applications/[id]/approve] Error:', error);
    if (error?.clerkError) {
      const msg = error.errors?.[0]?.message ?? 'Clerk API error';
      return NextResponse.json({ error: msg }, { status: 422 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
