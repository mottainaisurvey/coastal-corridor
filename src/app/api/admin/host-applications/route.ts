export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/admin/host-applications
 *
 * CC-C-08-D-2 — AC-4/5: List OperatorApplication records for host/both paths.
 *
 * Query params:
 *   status  — PENDING | REVIEWING | ACCEPTED | DECLINED (omit for all)
 *   search  — partial match on fullName or email
 *
 * Returns:
 *   { applications: HostApplication[], total: number, counts: Record<status|ALL, number> }
 *
 * Auth: ADMIN or SUPERADMIN only.
 */
export async function GET(req: NextRequest) {
  try {
    const { sessionClaims } = await auth();
    const role = (sessionClaims?.publicMetadata as any)?.role as string | undefined;
    if (!role || !['ADMIN', 'SUPERADMIN', 'admin', 'superadmin'].includes(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get('status') as string | null;
    const search = searchParams.get('search') ?? '';

    const validStatuses = ['PENDING', 'REVIEWING', 'ACCEPTED', 'DECLINED'];

    // Base where: host or both paths only
    const baseWhere = {
      path: { in: ['host', 'both'] },
    };

    // Build filtered where
    const filteredWhere: any = { ...baseWhere };
    if (statusFilter && validStatuses.includes(statusFilter)) {
      filteredWhere.status = statusFilter;
    }
    if (search) {
      filteredWhere.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Fetch applications + counts in parallel
    const [applications, total, pendingCount, reviewingCount, acceptedCount, declinedCount, allCount] =
      await Promise.all([
        prisma.operatorApplication.findMany({
          where: filteredWhere,
          orderBy: { createdAt: 'desc' },
          take: 100,
          select: {
            id: true,
            path: true,
            fullName: true,
            businessName: true,
            email: true,
            phone: true,
            corridorLocation: true,
            countryOfResidence: true,
            propertyType: true,
            numberOfRooms: true,
            currentlyListedOn: true,
            aboutOperation: true,
            whyCoastalCorridor: true,
            additionalInfo: true,
            status: true,
            cohortMember: true,
            adminNotes: true,
            reviewedBy: true,
            reviewedAt: true,
            clerkInviteId: true,
            createdAt: true,
          },
        }),
        prisma.operatorApplication.count({ where: filteredWhere }),
        prisma.operatorApplication.count({ where: { ...baseWhere, status: 'PENDING' } }),
        prisma.operatorApplication.count({ where: { ...baseWhere, status: 'REVIEWING' } }),
        prisma.operatorApplication.count({ where: { ...baseWhere, status: 'ACCEPTED' } }),
        prisma.operatorApplication.count({ where: { ...baseWhere, status: 'DECLINED' } }),
        prisma.operatorApplication.count({ where: baseWhere }),
      ]);

    return NextResponse.json({
      applications,
      total,
      counts: {
        ALL: allCount,
        PENDING: pendingCount,
        REVIEWING: reviewingCount,
        ACCEPTED: acceptedCount,
        DECLINED: declinedCount,
      },
    });
  } catch (error: any) {
    console.error('[GET /api/admin/host-applications] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
