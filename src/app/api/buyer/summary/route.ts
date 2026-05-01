import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: clerkId },
      select: { id: true, kycStatus: true },
    });

    if (!user) return NextResponse.json({ data: { savedCount: 0, inquiryCount: 0, transactionCount: 0, kycStatus: null } });

    const [savedCount, inquiryCount, transactionCount] = await Promise.all([
      prisma.savedPlot.count({ where: { userId: user.id } }),
      prisma.inquiry.count({ where: { userId: user.id } }),
      prisma.transaction.count({ where: { buyerId: user.id } }),
    ]);

    return NextResponse.json({
      data: {
        savedCount,
        inquiryCount,
        transactionCount,
        kycStatus: user.kycStatus || null,
      },
    });
  } catch (error) {
    console.error('[buyer/summary]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
