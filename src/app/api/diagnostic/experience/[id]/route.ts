import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db-safe';

const DIAGNOSTIC_SECRET = process.env.DIAGNOSTIC_SECRET ?? 'cc-probe-staging-2026';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const secret = req.headers.get('x-diagnostic-secret');
  if (secret !== DIAGNOSTIC_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  }

  const experience = await prisma.experience.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      owambeExperienceId: true,
      name: true,
      description: true,
      experienceType: true,
      durationMinutes: true,
      capacity: true,
      basePrice: true,
      baseCurrency: true,
      pricingModel: true,
      meetingPointDescription: true,
      meetingPointLatitude: true,
      meetingPointLongitude: true,
      status: true,
      createdAt: true,
      operatorUserId: true,
      timeSlots: {
        select: {
          id: true,
          owambeTimeSlotId: true,
          startDateTime: true,
          endDateTime: true,
          capacity: true,
          spotsBooked: true,
          rate: true,
          currency: true,
          recurrencePattern: true,
          status: true,
        },
        orderBy: { startDateTime: 'asc' },
      },
    },
  });

  if (!experience) {
    return NextResponse.json({ error: 'Experience not found' }, { status: 404 });
  }

  return NextResponse.json({
    experience: {
      ...experience,
      basePrice: experience.basePrice.toString(),
    },
  });
}
