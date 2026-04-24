import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { prisma } from '@/lib/db';

async function getDevProfile(clerkId: string) {
  const user = await prisma.user.findUnique({
    where: { id: clerkId },
    include: { devProfile: true },
  });
  return user?.devProfile || null;
}

export async function GET() {
  try {
    const { userId: clerkId } = auth();
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const devProfile = await getDevProfile(clerkId);
    if (!devProfile) {
      return NextResponse.json({ data: [] });
    }

    const projects = await prisma.project.findMany({
      where: { developerId: devProfile.id },
      orderBy: { createdAt: 'desc' },
      include: {
        destination: { select: { name: true, state: true } },
        _count: { select: { properties: true } },
      },
    });

    return NextResponse.json({
      data: projects.map((p: typeof projects[number]) => ({
        ...p,
        destination: p.destination?.name,
        priceFromKobo: p.priceFromKobo.toString(),
        priceToKobo: p.priceToKobo.toString(),
      })),
    });
  } catch (error) {
    console.error('[developer/projects GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = auth();
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const {
      name, description, destinationId, totalUnits, availableUnits,
      priceFromKobo, priceToKobo, status, amenities, completionDate,
    } = body;

    if (!name || !description || !destinationId || !totalUnits || !priceFromKobo || !priceToKobo) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Ensure developer profile exists
    let devProfile = await getDevProfile(clerkId);
    if (!devProfile) {
      // Auto-create a minimal DeveloperProfile so the user can proceed
      const dbUser = await prisma.user.findUnique({ where: { id: clerkId } });
      if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

      devProfile = await prisma.developerProfile.create({
        data: {
          userId: clerkId,
          companyName: dbUser.email.split('@')[0],
          cacNumber: `PENDING-${clerkId.slice(-8)}`,
        },
      });
    }

    // Generate a unique slug
    const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${Date.now()}`;

    const project = await prisma.project.create({
      data: {
        slug,
        name,
        description,
        developerId: devProfile.id,
        destinationId,
        totalUnits: parseInt(totalUnits),
        availableUnits: parseInt(availableUnits ?? totalUnits),
        priceFromKobo: BigInt(priceFromKobo),
        priceToKobo: BigInt(priceToKobo),
        status: status || 'planning',
        amenities: amenities || [],
        completionDate: completionDate ? new Date(completionDate) : null,
      },
    });

    return NextResponse.json({
      data: { ...project, priceFromKobo: project.priceFromKobo.toString(), priceToKobo: project.priceToKobo.toString() },
    }, { status: 201 });
  } catch (error) {
    console.error('[developer/projects POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
