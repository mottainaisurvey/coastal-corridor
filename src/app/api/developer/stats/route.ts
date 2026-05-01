import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // In this system, the DB user id equals the Clerk userId
    const clerkUser = await prisma.user.findUnique({
      where: { id: clerkId },
      include: { devProfile: true },
    });

    if (!clerkUser?.devProfile) {
      return NextResponse.json({
        data: {
          totalProjects: 0,
          totalListings: 0,
          totalInquiries: 0,
          totalViews: 0,
          recentInquiries: [],
          recentProjects: [],
        },
      });
    }

    const devProfileId = clerkUser.devProfile.id;

    const [projects, listings, recentInquiries] = await Promise.all([
      prisma.project.findMany({
        where: { developerId: devProfileId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { destination: { select: { name: true, state: true } } },
      }),
      prisma.listing.findMany({
        where: {
          property: { project: { developerId: devProfileId } },
          status: 'ACTIVE',
        },
        select: { id: true, viewCount: true, inquiryCount: true },
      }),
      prisma.inquiry.findMany({
        where: {
          listing: {
            property: { project: { developerId: devProfileId } },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          user: { select: { email: true } },
          listing: {
            include: { property: { select: { title: true } } },
          },
        },
      }),
    ]);

    const totalViews = listings.reduce((sum: number, l: { viewCount: number; inquiryCount: number }) => sum + l.viewCount, 0);
    const totalInquiries = listings.reduce((sum: number, l: { viewCount: number; inquiryCount: number }) => sum + l.inquiryCount, 0);

    return NextResponse.json({
      data: {
        totalProjects: projects.length,
        totalListings: listings.length,
        totalInquiries,
        totalViews,
        recentInquiries,
        recentProjects: projects.map((p: typeof projects[number]) => ({
          ...p,
          destination: p.destination?.name,
          priceFromKobo: p.priceFromKobo.toString(),
          priceToKobo: p.priceToKobo.toString(),
        })),
      },
    });
  } catch (error) {
    console.error('[developer/stats]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
