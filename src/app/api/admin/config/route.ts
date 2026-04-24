export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Default config values used when no DB record exists yet
const DEFAULTS: Record<string, any> = {
  listing_fee_pct: 1.5,
  transaction_fee_pct: 2.5,
  fractional_mgmt_fee_pct: 1.0,
  kyc_required: true,
  agent_license_required: true,
  plot_verification_required: true,
  min_fractional_shares: 10,
  max_fractional_shares: 1000,
  min_investment_ngn: 500000,
  maintenance_mode: false,
  new_registrations: true,
  api_rate_limit: 100,
  max_listings_per_agent: 50,
  session_timeout_minutes: 60,
};

/**
 * GET /api/admin/config
 */
export async function GET() {
  try {
    const records = await prisma.config.findMany();
    const config: Record<string, any> = { ...DEFAULTS };

    for (const r of records) {
      try {
        config[r.key] = JSON.parse(r.value);
      } catch {
        config[r.key] = r.value;
      }
    }

    return NextResponse.json({ data: config });
  } catch (error) {
    console.error('Config fetch failed:', error);
    return NextResponse.json({ data: DEFAULTS });
  }
}

/**
 * PUT /api/admin/config
 * Upsert one or more config keys.
 */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const updates = body as Record<string, any>;

    await Promise.all(
      Object.entries(updates).map(([key, value]) =>
        prisma.config.upsert({
          where: { key },
          update: { value: JSON.stringify(value) },
          create: { key, value: JSON.stringify(value) },
        })
      )
    );

    await prisma.auditEntry.create({
      data: {
        userId: null,
        entityType: 'Config',
        entityId: 'global',
        action: 'update',
        metadata: JSON.stringify({ updatedKeys: Object.keys(updates) }),
      },
    });

    return NextResponse.json({ data: { updated: Object.keys(updates) } });
  } catch (error) {
    console.error('Config update failed:', error);
    return NextResponse.json({ error: 'Failed to update config' }, { status: 500 });
  }
}
