export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';

/**
 * GET /api/admin/disputes
 *
 * NOTE: The Dispute model is not yet in the Prisma schema.
 * Disputes are currently tracked via Transaction.status = 'DISPUTED'.
 * This endpoint returns disputed transactions until a dedicated Dispute
 * model is added in a future migration.
 */
import { prisma } from '@/lib/db';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
    const offset = parseInt(searchParams.get('offset') || '0');

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where: { status: 'DISPUTED' },
        include: {
          buyer: { include: { profile: true } },
          listing: {
            include: {
              property: true,
              owner: { include: { profile: true } },
            },
          },
          payments: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.transaction.count({ where: { status: 'DISPUTED' } }),
    ]);

    return NextResponse.json({
      data: transactions.map((t: any) => ({
        id: t.id,
        reference: t.reference,
        status: t.status,
        agreedPriceKobo: t.agreedPriceKobo?.toString(),
        currency: t.currency,
        createdAt: t.createdAt,
        cancelReason: t.cancelReason,
        buyer: t.buyer
          ? {
              id: t.buyer.id,
              email: t.buyer.email,
              name: t.buyer.profile
                ? `${t.buyer.profile.firstName} ${t.buyer.profile.lastName}`
                : t.buyer.email,
            }
          : null,
        listing: t.listing
          ? {
              id: t.listing.id,
              title: t.listing.property?.title,
              agentName: t.listing.owner?.profile
                ? `${t.listing.owner.profile.firstName} ${t.listing.owner.profile.lastName}`
                : t.listing.owner?.email,
            }
          : null,
      })),
      pagination: { total, limit, offset, hasMore: offset + limit < total },
      _note: 'Disputes are tracked via Transaction.status=DISPUTED until a dedicated Dispute model is added.',
    });
  } catch (error) {
    console.error('Disputes fetch failed:', error);
    // Return empty list instead of 500 when DB is not connected
    return NextResponse.json({ data: [], pagination: { total: 0, limit: 50, offset: 0, hasMore: false } });
  }
}
