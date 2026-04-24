export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * PATCH /api/admin/users/[id]/role
 * Update a user's role. Superadmin only.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    const { role } = body;

    const validRoles = ['BUYER', 'AGENT', 'DEVELOPER', 'ADMIN', 'VERIFIER', 'GOVERNMENT', 'TOUR_OPERATOR'];
    if (!role || !validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { role },
      include: { profile: true },
    });

    await prisma.auditEntry.create({
      data: {
        userId: id,
        entityType: 'User',
        entityId: id,
        action: 'update',
        metadata: JSON.stringify({ field: 'role', newValue: role }),
      },
    });

    return NextResponse.json({
      data: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    console.error('Role update failed:', error);
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
  }
}
