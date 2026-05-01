export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/admin/listings
 * List all listings with optional status filter, search, and pagination.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || '';
    const search = searchParams.get('search') || '';
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {};
    if (status) where.status = status;

    if (search) {
      where.OR = [
        { property: { title: { contains: search, mode: 'insensitive' } } },
        { owner: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        include: {
          property: {
            include: {
              plot: { include: { destination: true } },
            },
          },
          owner: { include: { profile: true, agentProfile: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.listing.count({ where }),
    ]);

    return NextResponse.json({
      data: listings.map((l: any) => ({
        id: l.id,
        status: l.status,
        askingPriceKobo: l.askingPriceKobo?.toString(),
        currency: l.currency,
        viewCount: l.viewCount,
        inquiryCount: l.inquiryCount,
        featured: l.featured,
        createdAt: l.createdAt,
        property: l.property
          ? {
              id: l.property.id,
              title: l.property.title,
              type: l.property.type,
              titleStatus: l.property.titleStatus,
              destination: l.property.plot?.destination?.name,
              state: l.property.plot?.destination?.state,
            }
          : null,
        agent: l.owner
          ? {
              id: l.owner.id,
              email: l.owner.email,
              name: l.owner.profile
                ? `${l.owner.profile.firstName} ${l.owner.profile.lastName}`
                : l.owner.email,
              agencyName: l.owner.agentProfile?.agencyName,
              licenseVerified: l.owner.agentProfile?.licenseVerified,
            }
          : null,
      })),
      pagination: { total, limit, offset, hasMore: offset + limit < total },
    });
  } catch (error) {
    console.error('Admin listings fetch failed:', error);
    // Return empty list instead of 500 when DB is not connected
    return NextResponse.json({ data: [], pagination: { total: 0, limit: 50, offset: 0, hasMore: false } });
  }
}

/**
 * PATCH /api/admin/listings
 * Update listing status (approve, suspend, etc.)
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status, adminNote } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'id and status required' }, { status: 400 });
    }

    const listing = await prisma.listing.update({
      where: { id },
      data: { status },
    });

    await prisma.auditEntry.create({
      data: {
        userId: null,
        entityType: 'Listing',
        entityId: id,
        action: 'update',
        metadata: JSON.stringify({ field: 'status', newValue: status, note: adminNote }),
      },
    });

    return NextResponse.json({ data: { id: listing.id, status: listing.status } });
  } catch (error) {
    console.error('Listing status update failed:', error);
    return NextResponse.json({ error: 'Failed to update listing' }, { status: 500 });
  }
}
