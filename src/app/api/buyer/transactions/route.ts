import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const transactions = await prisma.transaction.findMany({
      where: { buyerId: clerkId },
      orderBy: { createdAt: 'desc' },
      include: {
        listing: {
          include: {
            property: {
              include: {
                plot: {
                  include: {
                    destination: { select: { name: true, state: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      data: transactions.map((t: typeof transactions[number]) => ({
        ...t,
        agreedPriceKobo: t.agreedPriceKobo.toString(),
      })),
    });
  } catch (error) {
    console.error('[buyer/transactions]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
