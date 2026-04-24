export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/admin/users
 * List all users with optional search, role filter, status filter, pagination.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const status = searchParams.get('status') || '';
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {};
    if (role) where.role = role;
    if (status) where.status = status;

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { profile: { firstName: { contains: search, mode: 'insensitive' } } },
        { profile: { lastName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          profile: true,
          agentProfile: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      data: users.map((u: any) => ({
        id: u.id,
        email: u.email,
        role: u.role,
        status: u.status,
        kycStatus: u.kycStatus,
        diasporaCountry: u.diasporaCountry,
        createdAt: u.createdAt,
        profile: u.profile
          ? {
              firstName: u.profile.firstName,
              lastName: u.profile.lastName,
              avatar: u.profile.avatar,
              bio: u.profile.bio,
            }
          : null,
        agentProfile: u.agentProfile
          ? {
              licenseNumber: u.agentProfile.licenseNumber,
              licenseVerified: u.agentProfile.licenseVerified,
              agencyName: u.agentProfile.agencyName,
              rating: u.agentProfile.rating,
            }
          : null,
      })),
      pagination: { total, limit, offset, hasMore: offset + limit < total },
    });
  } catch (error) {
    console.error('Admin users fetch failed:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
