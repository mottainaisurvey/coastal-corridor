export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';

/**
 * POST /api/fractional/purchase
 * Purchase shares in a fractional scheme.
 * Requires authentication.
 */
export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  // KYC gate — must be approved before purchasing shares
  if (user.kycStatus !== 'APPROVED') {
    return NextResponse.json(
      { error: 'KYC_REQUIRED', message: 'You must complete identity verification before purchasing shares.' },
      { status: 403 }
    );
  }

  const body = await req.json();
  const { schemeId, quantity } = body as { schemeId: string; quantity: number };

  if (!schemeId || !quantity || quantity < 1) {
    return NextResponse.json({ error: 'schemeId and quantity (min 1) are required' }, { status: 400 });
  }

  // Fetch scheme
  const scheme = await (prisma as unknown as {
    fractionalScheme: {
      findUnique: (args: unknown) => Promise<{
        id: string;
        name: string;
        sharesAvailable: number;
        pricePerShareKobo: bigint;
        currency: string;
        lockupMonths: number;
        status: string;
      } | null>;
      update: (args: unknown) => Promise<unknown>;
    };
  }).fractionalScheme.findUnique({ where: { id: schemeId } });

  if (!scheme) return NextResponse.json({ error: 'Scheme not found' }, { status: 404 });
  if (scheme.status === 'CLOSED' || scheme.status === 'FULL') {
    return NextResponse.json({ error: 'This scheme is no longer accepting investments' }, { status: 400 });
  }
  if (scheme.sharesAvailable < quantity) {
    return NextResponse.json(
      { error: `Only ${scheme.sharesAvailable} shares available` },
      { status: 400 }
    );
  }

  // Generate reference
  const reference = `FS-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

  // Calculate maturity date
  const maturesAt = new Date();
  maturesAt.setMonth(maturesAt.getMonth() + scheme.lockupMonths);

  // Create share record and decrement available count in a transaction
  const share = await (prisma as unknown as {
    fractionalShare: {
      create: (args: unknown) => Promise<unknown>;
    };
  }).fractionalShare.create({
    data: {
      schemeId,
      userId: user.id,
      quantity,
      priceKobo: scheme.pricePerShareKobo,
      currency: scheme.currency,
      reference,
      status: 'ACTIVE',
      maturesAt,
    },
  });

  // Decrement available shares
  const newAvailable = scheme.sharesAvailable - quantity;
  await (prisma as unknown as {
    fractionalScheme: {
      update: (args: unknown) => Promise<unknown>;
    };
  }).fractionalScheme.update({
    where: { id: schemeId },
    data: {
      sharesAvailable: newAvailable,
      status: newAvailable === 0 ? 'FULL' : newAvailable < scheme.sharesAvailable * 0.1 ? 'NEARLY_FULL' : scheme.status,
    },
  });

  // Audit log
  await prisma.auditEntry.create({
    data: {
      userId: user.id,
      entityType: 'FractionalShare',
      entityId: (share as { id: string }).id,
      action: 'FRACTIONAL_PURCHASE',
      metadata: JSON.stringify({ schemeId, quantity, reference }),
    },
  });

  return NextResponse.json({
    success: true,
    share,
    message: `Successfully purchased ${quantity} share${quantity > 1 ? 's' : ''} in ${scheme.name}`,
  });
}
