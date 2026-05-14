export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';

/**
 * POST /api/admin/host-applications/[id]/reject
 *
 * CC-C-08-D-2 — AC-5: Reject a host application.
 *
 * Updates OperatorApplication:
 *   status = 'DECLINED'
 *   adminNotes = <from request body>
 *   reviewedBy = admin's Clerk userId
 *   reviewedAt = now()
 *
 * No Clerk invitation is issued.
 *
 * Body: { adminNotes?: string }
 * Auth: ADMIN or SUPERADMIN only.
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
    const adminNotes: string = typeof body.adminNotes === 'string' ? body.adminNotes.trim() : '';

    // Load the application
    const application = await prisma.operatorApplication.findUnique({
      where: { id },
    });
    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }
    if (!['host', 'both'].includes(application.path)) {
      return NextResponse.json({ error: 'Application is not a host application' }, { status: 400 });
    }
    if (application.status === 'DECLINED') {
      return NextResponse.json({ error: 'Application is already declined' }, { status: 409 });
    }
    if (application.status === 'ACCEPTED') {
      return NextResponse.json({ error: 'Cannot decline an already accepted application' }, { status: 409 });
    }

    const updated = await prisma.operatorApplication.update({
      where: { id },
      data: {
        status: 'DECLINED',
        adminNotes: adminNotes || null,
        reviewedBy: userId ?? null,
        reviewedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      applicationId: updated.id,
      status: 'DECLINED',
    });
  } catch (error: any) {
    console.error('[POST /api/admin/host-applications/[id]/reject] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
