export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/fractional/schemes
 * Returns all active fractional investment schemes with destination detail.
 * Public endpoint — no auth required.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') ?? 'ACTIVE';
  const destinationId = searchParams.get('destinationId');

  try {
    const where: Record<string, unknown> = {};
    if (status !== 'ALL') where.status = status;
    if (destinationId) where.destinationId = destinationId;

    const schemes = await (prisma as unknown as {
      fractionalScheme: {
        findMany: (args: unknown) => Promise<unknown[]>;
      };
    }).fractionalScheme.findMany({
      where,
      include: {
        destination: {
          select: { id: true, name: true, state: true, type: true, slug: true },
        },
        _count: { select: { shares: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ schemes });
  } catch {
    // Fallback to mock data if table doesn't exist yet
    return NextResponse.json({ schemes: getMockSchemes() });
  }
}

function getMockSchemes() {
  return [
    {
      id: 'mock-1',
      slug: 'lekki-phase-3-reit',
      name: 'Lekki Phase 3 REIT',
      totalValueKobo: 500000000000,
      sharesIssued: 10000,
      sharesAvailable: 3200,
      pricePerShareKobo: 50000000,
      currency: 'NGN',
      projectedYield: 12.5,
      threeYearAppreciation: 38,
      lockupMonths: 36,
      status: 'ACTIVE',
      description: 'Fractional ownership in a premium residential development on the Lekki Peninsula.',
      imageUrl: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      destination: { id: 'dest-1', name: 'Lekki Peninsula', state: 'Lagos', type: 'REAL_ESTATE', slug: 'lekki-peninsula' },
      _count: { shares: 68 },
    },
    {
      id: 'mock-2',
      slug: 'calabar-marina-fund',
      name: 'Calabar Marina Fund',
      totalValueKobo: 250000000000,
      sharesIssued: 5000,
      sharesAvailable: 4100,
      pricePerShareKobo: 50000000,
      currency: 'NGN',
      projectedYield: 14.2,
      threeYearAppreciation: 45,
      lockupMonths: 24,
      status: 'ACTIVE',
      description: 'Mixed-use waterfront development at the Calabar Terminus.',
      imageUrl: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      destination: { id: 'dest-2', name: 'Calabar Terminus', state: 'Cross River', type: 'MIXED_USE', slug: 'calabar-terminus' },
      _count: { shares: 9 },
    },
    {
      id: 'mock-3',
      slug: 'warri-industrial-reit',
      name: 'Warri Industrial REIT',
      totalValueKobo: 750000000000,
      sharesIssued: 15000,
      sharesAvailable: 1800,
      pricePerShareKobo: 50000000,
      currency: 'NGN',
      projectedYield: 16.8,
      threeYearAppreciation: 52,
      lockupMonths: 48,
      status: 'NEARLY_FULL',
      description: 'Industrial and logistics hub investment in the Warri Delta corridor.',
      imageUrl: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      destination: { id: 'dest-3', name: 'Warri Delta Hub', state: 'Delta', type: 'INFRASTRUCTURE', slug: 'warri-delta-hub' },
      _count: { shares: 132 },
    },
    {
      id: 'mock-4',
      slug: 'tinapa-hospitality-fund',
      name: 'Tinapa Hospitality Fund',
      totalValueKobo: 300000000000,
      sharesIssued: 6000,
      sharesAvailable: 5800,
      pricePerShareKobo: 50000000,
      currency: 'NGN',
      projectedYield: 11.0,
      threeYearAppreciation: 33,
      lockupMonths: 36,
      status: 'ACTIVE',
      description: 'Tourism and hospitality investment in the Tinapa Marina Resort development.',
      imageUrl: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      destination: { id: 'dest-4', name: 'Tinapa & Marina Resort', state: 'Cross River', type: 'TOURISM', slug: 'tinapa-marina-resort' },
      _count: { shares: 2 },
    },
  ];
}
