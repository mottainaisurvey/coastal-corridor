// TEST MIDDLEWARE — bypasses Clerk for local visual testing
// This file is NOT used in production. To activate, rename to middleware.ts
// and rename the real middleware.ts to middleware.prod.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(_req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
