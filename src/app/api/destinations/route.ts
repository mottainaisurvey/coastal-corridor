export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { destinations } from '@/lib/mock/destinations';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');
  const state = searchParams.get('state');

  let list = [...destinations];
  if (type) list = list.filter((d) => d.type === type);
  if (state) list = list.filter((d) => d.state.toLowerCase() === state.toLowerCase());

  return NextResponse.json({ data: list });
}
