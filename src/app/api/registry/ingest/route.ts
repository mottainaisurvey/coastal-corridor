export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const SUPPORTED_REGISTRIES = ['LASRERA', 'OGUNIRS', 'NIS', 'FMBN', 'DELTAMOL', 'CROSSRIVERMOL'];

/**
 * POST /api/registry/ingest
 * Webhook endpoint for state registry connectors.
 * Receives a payload from a registry, stores it, and attempts to match to a Plot.
 *
 * Expected payload:
 * {
 *   registry: "LASRERA",
 *   externalId: "LAS-2024-00123",
 *   titleNumber?: string,
 *   plotCoordinates?: { lat: number, lng: number },
 *   ownerName?: string,
 *   rawData: object
 * }
 *
 * Authentication: Bearer token in Authorization header (registry-specific shared secret)
 */
export async function POST(req: NextRequest) {
  // Validate registry token
  const authHeader = req.headers.get('authorization');
  const expectedToken = process.env.REGISTRY_WEBHOOK_SECRET;

  if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { registry, externalId, titleNumber, plotCoordinates, rawData } = body as {
    registry: string;
    externalId: string;
    titleNumber?: string;
    plotCoordinates?: { lat: number; lng: number };
    rawData: Record<string, unknown>;
  };

  if (!registry || !externalId) {
    return NextResponse.json({ error: 'registry and externalId are required' }, { status: 400 });
  }

  if (!SUPPORTED_REGISTRIES.includes(registry)) {
    return NextResponse.json({ error: `Unknown registry: ${registry}` }, { status: 400 });
  }

  // Attempt to match to a Plot by title number or coordinates
  let matchedPlotId: string | null = null;

  if (titleNumber) {
    const plot = await prisma.plot.findFirst({
      where: { titleNumber },
      select: { id: true },
    });
    if (plot) matchedPlotId = plot.id;
  }

  if (!matchedPlotId && plotCoordinates) {
    // Find nearest plot within 100m (approximate lat/lng delta)
    const delta = 0.001; // ~100m
    const plot = await prisma.plot.findFirst({
      where: {
        latitude: { gte: plotCoordinates.lat - delta, lte: plotCoordinates.lat + delta },
        longitude: { gte: plotCoordinates.lng - delta, lte: plotCoordinates.lng + delta },
      },
      select: { id: true },
    });
    if (plot) matchedPlotId = plot.id;
  }

  // Upsert registry record
  const record = await (prisma as unknown as {
    registryRecord: {
      upsert: (args: unknown) => Promise<{ id: string; status: string }>;
    };
  }).registryRecord.upsert({
    where: { registry_externalId: { registry, externalId } },
    create: {
      registry,
      externalId,
      plotId: matchedPlotId,
      rawPayload: JSON.stringify(rawData ?? body),
      status: matchedPlotId ? 'MATCHED' : 'UNMATCHED',
      matchedAt: matchedPlotId ? new Date() : null,
    },
    update: {
      rawPayload: JSON.stringify(rawData ?? body),
      plotId: matchedPlotId,
      status: matchedPlotId ? 'MATCHED' : 'UNMATCHED',
      matchedAt: matchedPlotId ? new Date() : null,
      updatedAt: new Date(),
    },
  });

  return NextResponse.json({
    success: true,
    recordId: record.id,
    status: record.status,
    matched: !!matchedPlotId,
    plotId: matchedPlotId,
  });
}

/**
 * GET /api/registry/ingest
 * Returns registry ingestion stats for the admin dashboard.
 * Requires admin auth (checked by middleware).
 */
export async function GET(_req: NextRequest) {
  try {
    const records = await (prisma as unknown as {
      registryRecord: {
        groupBy: (args: unknown) => Promise<Array<{ registry: string; status: string; _count: { id: number } }>>;
        findMany: (args: unknown) => Promise<Array<{
          id: string;
          registry: string;
          externalId: string;
          plotId: string | null;
          status: string;
          matchedAt: Date | null;
          createdAt: Date;
        }>>;
      };
    }).registryRecord.groupBy({
      by: ['registry', 'status'],
      _count: { id: true },
    });

    const recent = await (prisma as unknown as {
      registryRecord: {
        findMany: (args: unknown) => Promise<Array<{
          id: string;
          registry: string;
          externalId: string;
          plotId: string | null;
          status: string;
          matchedAt: Date | null;
          createdAt: Date;
        }>>;
      };
    }).registryRecord.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        registry: true,
        externalId: true,
        plotId: true,
        status: true,
        matchedAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ stats: records, recent });
  } catch {
    return NextResponse.json({ stats: [], recent: [] });
  }
}
