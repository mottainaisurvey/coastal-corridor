import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const { userId: clerkId } = auth();
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const saved = await prisma.savedPlot.findMany({
      where: { userId: clerkId },
      orderBy: { createdAt: 'desc' },
      include: {
        plot: {
          include: {
            destination: { select: { name: true, state: true } },
            listings: {
              where: { status: 'ACTIVE' },
              take: 1,
              include: {
                property: { select: { title: true } },
              },
              select: {
                id: true,
                askingPriceKobo: true,
                currency: true,
                property: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      data: saved.map((s: typeof saved[number]) => ({
        ...s,
        plot: {
          ...s.plot,
          areaSqm: s.plot.areaSqm,
          listings: s.plot.listings.map((l: typeof s.plot.listings[number]) => ({
            ...l,
            askingPriceKobo: l.askingPriceKobo.toString(),
          })),
        },
      })),
    });
  } catch (error) {
    console.error('[buyer/saved GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = auth();
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { plotId, note } = await req.json();
    if (!plotId) return NextResponse.json({ error: 'plotId is required' }, { status: 400 });

    const saved = await prisma.savedPlot.upsert({
      where: { userId_plotId: { userId: clerkId, plotId } },
      create: { userId: clerkId, plotId, note: note || null },
      update: { note: note || null },
    });

    return NextResponse.json({ data: saved }, { status: 201 });
  } catch (error) {
    console.error('[buyer/saved POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId: clerkId } = auth();
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

    await prisma.savedPlot.deleteMany({
      where: { id, userId: clerkId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[buyer/saved DELETE]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
