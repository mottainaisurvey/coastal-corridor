export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/admin/transactions
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
        { buyer: { email: { contains: search, mode: 'insensitive' } } },
        { listing: { property: { title: { contains: search, mode: 'insensitive' } } } },
        { reference: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          buyer: { include: { profile: true } },
          listing: {
            include: {
              property: {
                include: { plot: { include: { destination: true } } },
              },
            },
          },
          payments: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.transaction.count({ where }),
    ]);

    return NextResponse.json({
      data: transactions.map((t: any) => ({
        id: t.id,
        reference: t.reference,
        status: t.status,
        agreedPriceKobo: t.agreedPriceKobo?.toString(),
        currency: t.currency,
        escrowProvider: t.escrowProvider,
        createdAt: t.createdAt,
        completedAt: t.completedAt,
        cancelledAt: t.cancelledAt,
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
              destination: t.listing.property?.plot?.destination?.name,
            }
          : null,
        payments: t.payments.map((p: any) => ({
          id: p.id,
          provider: p.provider,
          amountKobo: p.amountKobo?.toString(),
          status: p.status,
          processedAt: p.processedAt,
        })),
      })),
      pagination: { total, limit, offset, hasMore: offset + limit < total },
    });
  } catch (error) {
    console.error('Admin transactions fetch failed:', error);
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}
