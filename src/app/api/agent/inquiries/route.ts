import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      );
    }

    // Get agent profile
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { agentProfile: true },
    });

    if (!user?.agentProfile) {
      return NextResponse.json(
        { error: 'Not an agent' },
        { status: 403 }
      );
    }

    // Build query
    const where: any = {
      listing: {
        agentId: user.agentProfile.id,
      },
    };

    if (status) {
      where.status = status;
    }

    // Fetch inquiries
    const [inquiries, total] = await Promise.all([
      prisma.inquiry.findMany({
        where,
        include: {
          listing: { include: { property: true } },
          user: { include: { profile: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.inquiry.count({ where }),
    ]);

    return NextResponse.json({
      data: inquiries,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('Failed to fetch agent inquiries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inquiries' },
      { status: 500 }
    );
  }
}
