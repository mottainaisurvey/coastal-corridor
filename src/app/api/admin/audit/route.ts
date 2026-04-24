export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/admin/audit
 * List audit log entries with optional action/entity filter and pagination.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action') || '';
    const entityType = searchParams.get('entityType') || '';
    const search = searchParams.get('search') || '';
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {};
    if (action) where.action = action;
    if (entityType) where.entityType = entityType;

    if (search) {
      where.OR = [
        { entityId: { contains: search, mode: 'insensitive' } },
        { userId: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [entries, total] = await Promise.all([
      prisma.auditEntry.findMany({
        where,
        include: {
          user: { include: { profile: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.auditEntry.count({ where }),
    ]);

    return NextResponse.json({
      data: entries.map((e: any) => ({
        id: e.id,
        action: e.action,
        entityType: e.entityType,
        entityId: e.entityId,
        metadata: e.metadata,
        createdAt: e.createdAt,
        user: e.user
          ? {
              id: e.user.id,
              email: e.user.email,
              role: e.user.role,
              name: e.user.profile
                ? `${e.user.profile.firstName} ${e.user.profile.lastName}`
                : e.user.email,
            }
          : { id: e.userId, email: 'system', role: 'ADMIN', name: 'System' },
      })),
      pagination: { total, limit, offset, hasMore: offset + limit < total },
    });
  } catch (error) {
    console.error('Audit log fetch failed:', error);
    return NextResponse.json({ error: 'Failed to fetch audit log' }, { status: 500 });
  }
}
