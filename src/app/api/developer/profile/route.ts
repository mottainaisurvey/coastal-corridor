import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: clerkId },
      include: {
        profile: true,
        devProfile: true,
      },
    });

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    return NextResponse.json({
      data: {
        profile: user.profile,
        devProfile: user.devProfile,
      },
    });
  } catch (error) {
    console.error('[developer/profile GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { firstName, lastName, companyName, cacNumber, tin, yearFounded, description, website } = body;

    if (!companyName || !cacNumber) {
      return NextResponse.json({ error: 'Company name and CAC number are required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: clerkId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Upsert profile
    await prisma.profile.upsert({
      where: { userId: clerkId },
      create: { userId: clerkId, firstName: firstName || '', lastName: lastName || '' },
      update: { firstName: firstName || '', lastName: lastName || '' },
    });

    // Upsert developer profile
    const devProfile = await prisma.developerProfile.upsert({
      where: { userId: clerkId },
      create: {
        userId: clerkId,
        companyName,
        cacNumber,
        tin: tin || null,
        yearFounded: yearFounded ? parseInt(yearFounded) : null,
        description: description || null,
        website: website || null,
      },
      update: {
        companyName,
        cacNumber,
        tin: tin || null,
        yearFounded: yearFounded ? parseInt(yearFounded) : null,
        description: description || null,
        website: website || null,
      },
    });

    return NextResponse.json({ data: devProfile });
  } catch (error: any) {
    console.error('[developer/profile PUT]', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'CAC number is already registered to another account' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
