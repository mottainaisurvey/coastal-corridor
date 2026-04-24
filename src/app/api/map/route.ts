export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/map
 * Returns GeoJSON FeatureCollections for:
 * - destinations (points)
 * - plots (points with status/price)
 * - listings (active only)
 *
 * Used by the /map page MapLibre GL viewer.
 */
export async function GET(_req: NextRequest) {
  try {
    const [destinations, plots] = await Promise.all([
      prisma.destination.findMany({
        select: {
          id: true, slug: true, name: true, state: true, type: true,
          latitude: true, longitude: true, description: true, corridorKm: true,
          _count: { select: { plots: true } },
        },
      }),
      prisma.plot.findMany({
        where: { deletedAt: null },
        select: {
          id: true, plotId: true, latitude: true, longitude: true,
          status: true, areaSqm: true, totalPrice: true, currency: true,
          titleStatus: true, titleType: true,
          destination: { select: { id: true, name: true, state: true, slug: true } },
          property: {
            select: {
              id: true, type: true, title: true, bedrooms: true,
              bathrooms: true, heroImage: true,
              listings: {
                where: { status: 'ACTIVE' },
                select: { id: true, askingPriceKobo: true, currency: true },
                take: 1,
              },
            },
          },
        },
        take: 500,
      }),
    ]);

    // Build destination GeoJSON
    const destinationGeoJSON = {
      type: 'FeatureCollection',
      features: destinations.map((d: typeof destinations[number]) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [d.longitude, d.latitude] },
        properties: {
          id: d.id,
          slug: d.slug,
          name: d.name,
          state: d.state,
          type: d.type,
          description: d.description,
          corridorKm: d.corridorKm,
          plotCount: d._count.plots,
        },
      })),
    };

    // Build plot GeoJSON
    const plotGeoJSON = {
      type: 'FeatureCollection',
      features: plots.map((p: typeof plots[number]) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [p.longitude, p.latitude] },
        properties: {
          id: p.id,
          plotId: p.plotId,
          status: p.status,
          areaSqm: p.areaSqm,
          totalPriceKobo: p.totalPrice.toString(),
          currency: p.currency,
          titleStatus: p.titleStatus,
          titleType: p.titleType,
          destinationId: p.destination.id,
          destinationName: p.destination.name,
          destinationState: p.destination.state,
          destinationSlug: p.destination.slug,
          propertyType: p.property?.type ?? null,
          propertyTitle: p.property?.title ?? null,
          bedrooms: p.property?.bedrooms ?? null,
          bathrooms: p.property?.bathrooms ?? null,
          heroImage: p.property?.heroImage ?? null,
          listingId: p.property?.listings?.[0]?.id ?? null,
          askingPriceKobo: p.property?.listings?.[0]?.askingPriceKobo?.toString() ?? null,
        },
      })),
    };

    return NextResponse.json({ destinations: destinationGeoJSON, plots: plotGeoJSON });
  } catch (err) {
    console.error('Map API error:', err);
    return NextResponse.json({ destinations: { type: 'FeatureCollection', features: [] }, plots: { type: 'FeatureCollection', features: [] } });
  }
}
