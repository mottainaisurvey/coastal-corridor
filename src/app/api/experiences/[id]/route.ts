/**
 * GET /api/experiences/[id]
 *
 * CC-D-01-A AC-2 — Public guest-facing experience detail endpoint.
 *
 * Returns full detail for a single ACTIVE experience by id, including:
 *   - All guest-visible Experience fields
 *   - Operator info (displayName from OperatorProfile, verificationLevel)
 *   - All ExperienceImage records (ordered by sortOrder)
 *   - TimeSlots: upcoming slots for the next 30 days where status is
 *     OPEN or FULL and startDateTime is in the future
 *
 * Non-ACTIVE experiences return 404.
 * Non-existent IDs return 404.
 *
 * Public endpoint — no auth required.
 *
 * Data sources (confirmed in AC-0):
 *   - Experience: all guest-visible fields
 *   - ExperienceImage: url, caption, isPrimary, sortOrder
 *   - OperatorProfile: displayName ?? businessName, verificationLevel
 *   - TimeSlot: startDateTime, endDateTime, capacity, spotsBooked, rate,
 *     currency, status — filtered to next 30 days, OPEN/FULL only
 */
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getPrismaClient } from '@/lib/db-safe';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const { id } = params;

  const db = getPrismaClient();
  if (!db) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  }

  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const experience = await db.experience.findUnique({
    where: { id },
    select: {
      id:                      true,
      owambeExperienceId:      true,
      name:                    true,
      description:             true,
      experienceType:          true,
      durationMinutes:         true,
      capacity:                true,
      meetingPointDescription: true,
      meetingPointLatitude:    true,
      meetingPointLongitude:   true,
      pricingModel:            true,
      basePrice:               true,
      baseCurrency:            true,
      ageRestriction:          true,
      fitnessRequirement:      true,
      weatherDependent:        true,
      equipmentProvided:       true,
      equipmentRequired:       true,
      status:                  true,
      verificationLevel:       true,
      verifiedAt:              true,
      createdAt:               true,
      images: {
        orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
        select:  { id: true, url: true, caption: true, isPrimary: true, sortOrder: true },
      },
      operator: {
        select: {
          operatorProfile: {
            select: {
              displayName:       true,
              businessName:      true,
              verificationLevel: true,
              verifiedAt:        true,
            },
          },
        },
      },
      timeSlots: {
        where: {
          status:        { in: ['OPEN', 'FULL'] },
          startDateTime: { gte: now, lte: in30Days },
        },
        orderBy: { startDateTime: 'asc' },
        select: {
          id:            true,
          startDateTime: true,
          endDateTime:   true,
          capacity:      true,
          spotsBooked:   true,
          rate:          true,
          currency:      true,
          status:        true,
        },
      },
    },
  });

  if (!experience || experience.status !== 'ACTIVE') {
    return NextResponse.json({ error: 'Experience not found' }, { status: 404 });
  }

  const op = experience.operator?.operatorProfile;
  const operatorDisplayName = op?.displayName ?? op?.businessName ?? null;
  const primaryImage = experience.images.find(img => img.isPrimary)?.url
    ?? experience.images[0]?.url
    ?? null;

  const shaped = {
    id:                      experience.id,
    name:                    experience.name,
    description:             experience.description,
    experienceType:          experience.experienceType,
    durationMinutes:         experience.durationMinutes,
    capacity:                experience.capacity,
    meetingPointDescription: experience.meetingPointDescription,
    meetingPointLatitude:    experience.meetingPointLatitude ? Number(experience.meetingPointLatitude) : null,
    meetingPointLongitude:   experience.meetingPointLongitude ? Number(experience.meetingPointLongitude) : null,
    pricingModel:            experience.pricingModel,
    basePrice:               Number(experience.basePrice),
    baseCurrency:            experience.baseCurrency,
    ageRestriction:          experience.ageRestriction ?? null,
    fitnessRequirement:      experience.fitnessRequirement ?? null,
    weatherDependent:        experience.weatherDependent,
    equipmentProvided:       experience.equipmentProvided,
    equipmentRequired:       experience.equipmentRequired,
    verificationLevel:       experience.verificationLevel ?? null,
    verifiedAt:              experience.verifiedAt?.toISOString() ?? null,
    createdAt:               experience.createdAt.toISOString(),
    primaryImage,
    images:                  experience.images.map(img => ({
      id:        img.id,
      url:       img.url,
      caption:   img.caption ?? null,
      isPrimary: img.isPrimary,
    })),
    operator: {
      displayName:       operatorDisplayName,
      verificationLevel: op?.verificationLevel ?? null,
      verifiedAt:        op?.verifiedAt?.toISOString() ?? null,
    },
    timeSlots: experience.timeSlots.map(slot => ({
      id:            slot.id,
      startDateTime: slot.startDateTime.toISOString(),
      endDateTime:   slot.endDateTime.toISOString(),
      capacity:      slot.capacity,
      spotsBooked:   slot.spotsBooked,
      spotsRemaining: slot.capacity - slot.spotsBooked,
      rate:          slot.rate ? Number(slot.rate) : null,
      currency:      slot.currency,
      status:        slot.status,
    })),
  };

  console.log(`[api/experiences/${id} GET] found, timeSlots=${shaped.timeSlots.length}`);
  return NextResponse.json(shaped);
}
