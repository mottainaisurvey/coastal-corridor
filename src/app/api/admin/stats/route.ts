import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Skip static generation for this route
export const dynamic = 'force-dynamic';

const EMPTY_STATS = {
  totalUsers: 0,
  agents: 0,
  developers: 0,
  buyers: 0,
  activeListings: 0,
  pendingListings: 0,
  soldListings: 0,
  verifiedAgents: 0,
  pendingAgentVerification: 0,
  pendingVerification: 0,
  totalTransactions: 0,
  completedTransactions: 0,
  failedTransactions: 0,
  newInquiries: 0,
};

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
    // Return empty stats instead of 500 when DB is not connected
    return NextResponse.json({ data: EMPTY_STATS });
  }
}
