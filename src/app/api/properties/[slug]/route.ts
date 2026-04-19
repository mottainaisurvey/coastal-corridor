export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getPropertyBySlug } from '@/lib/mock/properties';

export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  const property = getPropertyBySlug(params.slug);
  if (!property) {
    return NextResponse.json({ error: 'Property not found' }, { status: 404 });
  }
  return NextResponse.json({ data: property });
}
