import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    // Get total users by role
    const [totalUsers, agents, developers, buyers] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'AGENT' } }),
      prisma.user.count({ where: { role: 'DEVELOPER' } }),
      prisma.user.count({ where: { role: 'BUYER' } }),
    ]);

    // Get listing stats
    const [activeListings, pendingListings, soldListings] = await Promise.all([
      prisma.listing.count({ where: { status: 'ACTIVE' } }),
      prisma.listing.count({ where: { status: 'DRAFT' } }),
      prisma.listing.count({ where: { status: 'SOLD' } }),
    ]);

    // Get verification stats
    const [verifiedAgents, pendingAgentVerification] = await Promise.all([
      prisma.agentProfile.count({ where: { licenseVerified: true } }),
      prisma.agentProfile.count({ where: { licenseVerified: false } }),
    ]);

    // Get plot verification stats
    const pendingPlots = await prisma.plot.count({
      where: { titleStatus: 'PENDING' },
    });

    // Get transaction stats
    const [totalTransactions, completedTransactions, failedTransactions] = await Promise.all([
      prisma.transaction.count(),
      prisma.transaction.count({ where: { status: 'COMPLETED' } }),
      prisma.transaction.count({ where: { status: 'CANCELLED' } }),
    ]);

    // Get inquiry stats
    const newInquiries = await prisma.inquiry.count({
      where: { status: 'NEW' },
    });

    return NextResponse.json({
      data: {
        totalUsers,
        agents,
        developers,
        buyers,
        activeListings,
        pendingListings,
        soldListings,
        verifiedAgents,
        pendingAgentVerification,
        pendingVerification: pendingPlots + pendingAgentVerification,
        totalTransactions,
        completedTransactions,
        failedTransactions,
        newInquiries,
      },
    });
  } catch (error) {
    console.error('Failed to fetch admin stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
