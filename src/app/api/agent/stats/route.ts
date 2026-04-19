import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

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

    // Get active listings
    const activeListings = await prisma.listing.findMany({
      where: {
        agentId: user.agentProfile.id,
        status: 'ACTIVE',
      },
    });

    // Calculate stats
    const totalViews = activeListings.reduce((sum: number, l: any) => sum + l.viewCount, 0);
    const totalInquiries = activeListings.reduce((sum: number, l: any) => sum + l.inquiryCount, 0);
    const newInquiries = await prisma.inquiry.count({
      where: {
        listing: { agentId: user.agentProfile.id },
        status: 'NEW',
      },
    });

    // Calculate conversion rate (inquiries / views)
    const conversionRate = totalViews > 0 ? Math.round((totalInquiries / totalViews) * 100) : 0;

    return NextResponse.json({
      data: {
        activeListings: activeListings.length,
        totalViews,
        totalInquiries,
        newInquiries,
        conversionRate,
      },
    });
  } catch (error) {
    console.error('Failed to fetch agent stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
