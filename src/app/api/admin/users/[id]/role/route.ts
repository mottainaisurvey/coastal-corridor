export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getPrismaClient } from '@/lib/db-safe';
import { ensureHostProfile } from '@/lib/host-profile';

/**
 * PATCH /api/admin/users/[id]/role
 * Update a user's role(s). Superadmin only.
 *
 * CC-C-08-A AC-3a: HOST added to validRoles.
 * CC-C-08-A AC-3c: When role is set to HOST, ensureHostProfile fires.
 * CC-C-09-A-0: Accepts both legacy string form { role: "HOST" } and new
 *              array form { roles: ["HOST","OPERATOR"] }. Normalises to
 *              array internally; writes the canonical primary role to
 *              User.role (first element) for backward compatibility with
 *              existing DB queries that read User.role as a string.
 *
 * Body (either form accepted):
 *   { role: "HOST" }                       ← legacy single-role
 *   { roles: ["HOST","OPERATOR"] }         ← new multi-role
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();

    // CC-C-09-A-0: normalise both body forms to an array
    let rolesArray: string[];
    if (Array.isArray(body.roles)) {
      rolesArray = body.roles;
    } else if (typeof body.role === 'string') {
      rolesArray = [body.role];
    } else {
      return NextResponse.json({ error: 'role or roles is required' }, { status: 400 });
    }

    const validRoles = ['BUYER', 'AGENT', 'DEVELOPER', 'ADMIN', 'VERIFIER', 'GOVERNMENT', 'TOUR_OPERATOR', 'HOST', 'OPERATOR'];
    const invalidRoles = rolesArray.filter(r => !validRoles.includes(r));
    if (rolesArray.length === 0 || invalidRoles.length > 0) {
      return NextResponse.json(
        { error: `Invalid role(s): ${invalidRoles.join(', ')}` },
        { status: 400 }
      );
    }

    // Canonical primary role written to User.role for backward compatibility
    const primaryRole = rolesArray[0];

    const user = await prisma.user.update({
      where: { id },
      data: { role: primaryRole },
      include: { profile: true },
    });

    await prisma.auditEntry.create({
      data: {
        userId: id,
        entityType: 'User',
        entityId: id,
        action: 'update',
        metadata: JSON.stringify({ field: 'role', newValue: rolesArray }),
      },
    });

    // Provision HostProfile when HOST is in the roles array
    let hostProfileId: string | null = null;
    if (rolesArray.includes('HOST')) {
      const db = getPrismaClient();
      if (db) {
        const profile = await ensureHostProfile(id, db);
        hostProfileId = profile.id;
        console.log(
          `[admin/users/role] HOST role assigned to userId=${id} — HostProfile id=${profile.id}`
        );
      }
    }

    return NextResponse.json({
      data: {
        id: user.id,
        email: user.email,
        role: user.role,
        roles: rolesArray,
        status: user.status,
        ...(hostProfileId ? { hostProfileId } : {}),
      },
    });
  } catch (error) {
    console.error('Role update failed:', error);
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
  }
}
