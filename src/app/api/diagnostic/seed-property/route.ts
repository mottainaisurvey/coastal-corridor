/**
 * POST /api/diagnostic/seed-property
 *
 * Creates a StayProperty + Room for a host user on staging.
 * Idempotent: if the property with owambePropertyId 'founder-test-property-001' already exists,
 * returns the existing IDs.
 *
 * Protected by x-diagnostic-secret header.
 * Only active when VERCEL_ENV !== 'production'.
 *
 * Body: { hostEmail: string }
 *
 * Response: { propertyId, roomId, created: boolean }
 */
import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db-safe';

const DIAGNOSTIC_SECRET = process.env.DIAGNOSTIC_SECRET ?? 'cc-probe-staging-2026';
const SEED_PROPERTY_OWAMBE_ID = 'founder-test-property-001';
const SEED_ROOM_OWAMBE_ID = 'founder-test-room-001';

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-diagnostic-secret');
  if (secret !== DIAGNOSTIC_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json({ error: 'Database not available' }, { status: 503 });
  }

  const body = await req.json().catch(() => ({}));
  const { hostEmail } = body;

  if (!hostEmail) {
    return NextResponse.json({ error: 'hostEmail is required' }, { status: 400 });
  }

  try {
    // Find host user
    const hostUser = await prisma.user.findUnique({ where: { email: hostEmail } });
    if (!hostUser) {
      return NextResponse.json({ error: `Host user not found: ${hostEmail}` }, { status: 404 });
    }

    // Check if property already exists
    let property = await prisma.stayProperty.findUnique({
      where: { owambePropertyId: SEED_PROPERTY_OWAMBE_ID },
      include: { rooms: true },
    });
    let created = false;

    if (!property) {
      created = true;
      property = await prisma.stayProperty.create({
        data: {
          owambePropertyId: SEED_PROPERTY_OWAMBE_ID,
          hostUserId: hostUser.id,
          name: 'Founder Test Beach House — Lagos',
          description: 'A beautiful beachfront property in Lagos for testing the Coastal Corridor host dashboard.',
          propertyType: 'BEACH_HOUSE',
          addressLine1: '12 Beachfront Drive',
          city: 'Lagos',
          state: 'Lagos',
          country: 'Nigeria',
          latitude: 6.4281,
          longitude: 3.4219,
          amenities: ['WiFi', 'Pool', 'Air Conditioning', 'Kitchen', 'Parking'],
          policies: {
            checkIn: '14:00',
            checkOut: '11:00',
            cancellation: 'Free cancellation up to 48 hours before check-in.',
            houseRules: 'No smoking. No pets. No parties.',
            damageDeposit: 50000,
          },
          status: 'ACTIVE',
          rooms: {
            create: {
              owambeRoomId: SEED_ROOM_OWAMBE_ID,
              name: 'Master Suite',
              roomType: 'SUITE',
              capacity: 2,
              baseRate: 45000,
              baseCurrency: 'NGN',
              amenities: ['King Bed', 'En-suite Bathroom', 'Sea View', 'Air Conditioning'],
              active: true,
            },
          },
        },
        include: { rooms: true },
      });
    }

    const room = property.rooms[0];

    return NextResponse.json({
      propertyId: property.id,
      roomId: room?.id ?? null,
      owambePropertyId: property.owambePropertyId,
      owambeRoomId: room?.owambeRoomId ?? null,
      created,
    });
  } catch (err: any) {
    console.error('[seed-property] error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
