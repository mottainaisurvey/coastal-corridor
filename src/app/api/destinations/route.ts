export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { destinations as mockDestinations } from '@/lib/mock/destinations';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');
  const state = searchParams.get('state');

  try {
    const where: Record<string, unknown> = {};
    if (type) where.type = type;
    if (state) where.state = { equals: state, mode: 'insensitive' };

    const dbDestinations = await prisma.destination.findMany({
      where,
      orderBy: { corridorKm: 'asc' },
      select: { id: true, name: true, state: true, type: true, slug: true, corridorKm: true },
    });

    if (dbDestinations.length > 0) {
      return NextResponse.json({ data: dbDestinations });
    }
  } catch {
    // Fall through to mock data if DB is unavailable
  }

  // Fallback to mock data
  let list = [...mockDestinations];
  if (type) list = list.filter((d) => d.type === type);
  if (state) list = list.filter((d) => d.state.toLowerCase() === state.toLowerCase());
  return NextResponse.json({ data: list });
}
