export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/agent/profile
 */
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        agentProfile: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      data: {
        id: user.id,
        email: user.email,
        role: user.role,
        kycStatus: user.kycStatus,
        diasporaCountry: user.diasporaCountry,
        profile: user.profile,
        agentProfile: user.agentProfile,
      },
    });
  } catch (error) {
    console.error('Agent profile fetch failed:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

/**
 * PUT /api/agent/profile
 */
export async function PUT(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      firstName,
      lastName,
      bio,
      agencyName,
      licenseNumber,
      specialties,
      regionsCovered,
      yearsActive,
    } = body;

    // Upsert Profile (correct model name)
    const profile = await prisma.profile.upsert({
      where: { userId },
      update: {
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(bio !== undefined && { bio }),
      },
      create: {
        userId,
        firstName: firstName || '',
        lastName: lastName || '',
        bio,
      },
    });

    // Upsert AgentProfile (correct field names: specialties, regionsCovered)
    let agentProfile = null;
    if (agencyName !== undefined || licenseNumber !== undefined || specialties !== undefined) {
      agentProfile = await prisma.agentProfile.upsert({
        where: { userId },
        update: {
          ...(agencyName !== undefined && { agencyName }),
          ...(licenseNumber !== undefined && { licenseNumber }),
          ...(specialties !== undefined && { specialties }),
          ...(regionsCovered !== undefined && { regionsCovered }),
          ...(yearsActive !== undefined && { yearsActive }),
        },
        create: {
          userId,
          agencyName: agencyName || '',
          licenseNumber: licenseNumber || '',
          specialties: specialties || [],
          regionsCovered: regionsCovered || [],
          yearsActive: yearsActive || 0,
        },
      });
    }

    await prisma.auditEntry.create({
      data: {
        userId,
        entityType: 'Profile',
        entityId: userId,
        action: 'update',
        metadata: JSON.stringify({ updatedFields: Object.keys(body) }),
      },
    });

    return NextResponse.json({ data: { profile, agentProfile } });
  } catch (error) {
    console.error('Agent profile update failed:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
