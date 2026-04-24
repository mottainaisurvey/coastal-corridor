export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/admin/verification?type=agents|plots|kyc
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'agents';
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
    const offset = parseInt(searchParams.get('offset') || '0');

    if (type === 'agents') {
      const [items, total] = await Promise.all([
        prisma.agentProfile.findMany({
          where: { licenseVerified: false },
          include: { user: { include: { profile: true } } },
          orderBy: { createdAt: 'asc' },
          take: limit,
          skip: offset,
        }),
        prisma.agentProfile.count({ where: { licenseVerified: false } }),
      ]);

      return NextResponse.json({
        data: items.map((a: any) => ({
          id: a.id,
          licenseNumber: a.licenseNumber,
          agencyName: a.agencyName,
          licenseVerified: a.licenseVerified,
          createdAt: a.createdAt,
          user: {
            id: a.user.id,
            email: a.user.email,
            name: a.user.profile
              ? `${a.user.profile.firstName} ${a.user.profile.lastName}`
              : a.user.email,
          },
        })),
        pagination: { total, limit, offset, hasMore: offset + limit < total },
      });
    }

    if (type === 'plots') {
      const [items, total] = await Promise.all([
        prisma.plot.findMany({
          where: { titleStatus: 'PENDING' },
          include: { destination: true },
          orderBy: { createdAt: 'asc' },
          take: limit,
          skip: offset,
        }),
        prisma.plot.count({ where: { titleStatus: 'PENDING' } }),
      ]);

      return NextResponse.json({
        data: items.map((p: any) => ({
          id: p.id,
          plotNumber: p.plotNumber,
          sizeHectares: p.sizeHectares,
          titleStatus: p.titleStatus,
          titleDocUrl: p.titleDocUrl,
          createdAt: p.createdAt,
          destination: p.destination?.name,
          state: p.destination?.state,
        })),
        pagination: { total, limit, offset, hasMore: offset + limit < total },
      });
    }

    if (type === 'kyc') {
      const [items, total] = await Promise.all([
        prisma.user.findMany({
          where: { kycStatus: 'PENDING' },
          include: { profile: true },
          orderBy: { createdAt: 'asc' },
          take: limit,
          skip: offset,
        }),
        prisma.user.count({ where: { kycStatus: 'PENDING' } }),
      ]);

      return NextResponse.json({
        data: items.map((u: any) => ({
          id: u.id,
          email: u.email,
          role: u.role,
          kycStatus: u.kycStatus,
          createdAt: u.createdAt,
          profile: u.profile
            ? {
                firstName: u.profile.firstName,
                lastName: u.profile.lastName,
              }
            : null,
        })),
        pagination: { total, limit, offset, hasMore: offset + limit < total },
      });
    }

    return NextResponse.json({ error: 'Invalid type. Use: agents, plots, or kyc' }, { status: 400 });
  } catch (error) {
    console.error('Verification fetch failed:', error);
    return NextResponse.json({ error: 'Failed to fetch verification items' }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/verification
 * Approve or reject a verification item.
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, id, action, adminNote } = body;

    if (!type || !id || !action) {
      return NextResponse.json({ error: 'type, id, and action required' }, { status: 400 });
    }

    if (type === 'agent') {
      await prisma.agentProfile.update({
        where: { id },
        data: { licenseVerified: action === 'approve' },
      });
    } else if (type === 'kyc') {
      await prisma.user.update({
        where: { id },
        data: { kycStatus: action === 'approve' ? 'VERIFIED' : 'REJECTED' },
      });
    } else if (type === 'plot') {
      await prisma.plot.update({
        where: { id },
        data: { titleStatus: action === 'approve' ? 'VERIFIED' : 'REJECTED' },
      });
    }

    await prisma.auditEntry.create({
      data: {
        userId: null,
        entityType: type,
        entityId: id,
        action: 'update',
        metadata: JSON.stringify({ verificationAction: action, note: adminNote }),
      },
    });

    return NextResponse.json({ data: { id, type, action } });
  } catch (error) {
    console.error('Verification action failed:', error);
    return NextResponse.json({ error: 'Failed to process verification' }, { status: 500 });
  }
}
