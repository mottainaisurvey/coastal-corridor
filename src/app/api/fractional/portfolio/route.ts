export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/fractional/portfolio
 * Returns the authenticated user's fractional share portfolio.
 */
export async function GET(_req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  try {
    const shares = await (prisma as unknown as {
      fractionalShare: {
        findMany: (args: unknown) => Promise<Array<{
          id: string;
          quantity: number;
          priceKobo: bigint;
          currency: string;
          reference: string;
          status: string;
          purchasedAt: Date;
          maturesAt: Date | null;
          scheme: {
            id: string;
            name: string;
            slug: string;
            projectedYield: number;
            threeYearAppreciation: number;
            pricePerShareKobo: bigint;
            sharesAvailable: number;
            sharesIssued: number;
            status: string;
            destination: { name: string; state: string; type: string };
          };
        }>>;
      };
    }).fractionalShare.findMany({
      where: { userId: user.id },
      include: {
        scheme: {
          include: {
            destination: { select: { name: true, state: true, type: true } },
          },
        },
      },
      orderBy: { purchasedAt: 'desc' },
    });

    // Calculate portfolio summary
    const totalInvestedKobo = shares.reduce(
      (sum, s) => sum + Number(s.priceKobo) * s.quantity,
      0
    );
    const totalShares = shares.reduce((sum, s) => sum + s.quantity, 0);
    const activeSchemes = new Set(shares.map(s => s.scheme.id)).size;

    return NextResponse.json({
      shares: shares.map(s => ({
        ...s,
        priceKobo: s.priceKobo.toString(),
        scheme: {
          ...s.scheme,
          pricePerShareKobo: s.scheme.pricePerShareKobo.toString(),
        },
      })),
      summary: {
        totalInvestedKobo: totalInvestedKobo.toString(),
        totalShares,
        activeSchemes,
      },
    });
  } catch {
    return NextResponse.json({ shares: [], summary: { totalInvestedKobo: '0', totalShares: 0, activeSchemes: 0 } });
  }
}
