import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const {
      propertyType,
      destinationId,
      plotNumber,
      sizeHectares,
      titleStatus,
      bedrooms,
      bathrooms,
      floorArea,
      askingPriceKobo,
      negotiable,
      currency,
      title,
      description,
      amenities,
      agentEmail,
    } = body;

    if (!propertyType || !destinationId || !plotNumber || !sizeHectares || !titleStatus || !askingPriceKobo || !title || !description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Ensure submitter exists in DB
    const owner = await prisma.user.findUnique({ where: { id: clerkId } });
    if (!owner) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Resolve agent by email if provided
    let agentId: string | null = null;
    if (agentEmail) {
      const agentUser = await prisma.user.findUnique({
        where: { email: agentEmail },
        include: { agentProfile: true },
      });
      if (agentUser?.agentProfile) {
        agentId = agentUser.agentProfile.id;
      }
    }

    // Create the Plot record
    const areaSqm = parseFloat(sizeHectares) * 10000;
    const pricePerSqm = BigInt(Math.round(parseFloat(askingPriceKobo) / areaSqm));
    const plot = await prisma.plot.create({
      data: {
        plotId: `${plotNumber.toUpperCase()}-${Date.now()}`,
        destinationId,
        status: 'UNDER_VERIFICATION',
        latitude: 0,
        longitude: 0,
        areaSqm,
        pricePerSqm,
        totalPrice: BigInt(askingPriceKobo),
        titleType: 'DEED_OF_ASSIGNMENT', // default; admin can update
      },
    });

    // Create the Property record
    const property = await prisma.property.create({
      data: {
        plotId: plot.id,
        type: propertyType,
        title,
        description,
        bedrooms: bedrooms || null,
        bathrooms: bathrooms || null,
        floorArea: floorArea || null,
        amenities: amenities || [],
      },
    });

    // Create the Listing as DRAFT
    const listing = await prisma.listing.create({
      data: {
        status: 'DRAFT',
        plotId: plot.id,
        propertyId: property.id,
        ownerId: clerkId,
        agentId: agentId || null,
        askingPriceKobo: BigInt(askingPriceKobo),
        currency: currency || 'NGN',
        negotiable: negotiable || false,
        description,
      },
    });

    // Log audit entry
    await prisma.auditEntry.create({
      data: {
        userId: clerkId,
        action: 'create',
        entityType: 'Listing',
        entityId: listing.id,
        metadata: JSON.stringify({ title, plotNumber, destinationId }),
      },
    });

    return NextResponse.json({ data: { listingId: listing.id, plotId: plot.id } }, { status: 201 });
  } catch (error: any) {
    console.error('[listings/submit]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
