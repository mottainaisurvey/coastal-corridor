/**
 * Prisma seed script
 *
 * Usage: npm run db:seed
 *
 * This script takes the mock data from src/lib/mock/* and seeds it
 * into a real PostgreSQL database. Idempotent — safe to re-run.
 *
 * Before running:
 *   1. Ensure DATABASE_URL is set in .env
 *   2. Ensure PostGIS extension is enabled: CREATE EXTENSION postgis;
 *   3. Run `npm run db:push` to create the schema
 */

import { PrismaClient } from '@prisma/client';
import { destinations } from '../src/lib/mock/destinations';
import { properties } from '../src/lib/mock/properties';
import { agents, developers } from '../src/lib/mock/agents';

const prisma = new PrismaClient();

async function main() {
  console.log('🌊 Seeding Coastal Corridor database...\n');

  // ============ DESTINATIONS ============
  console.log('→ Seeding destinations...');
  for (const d of destinations) {
    await prisma.destination.upsert({
      where: { slug: d.slug },
      update: {},
      create: {
        id: d.id,
        slug: d.slug,
        name: d.name,
        state: d.state,
        type: d.type as any,
        latitude: d.latitude,
        longitude: d.longitude,
        corridorKm: d.corridorKm,
        description: d.description,
        heroImage: d.heroImage
      }
    });

    // Stats
    for (const [i, stat] of d.stats.entries()) {
      await prisma.destinationStat.create({
        data: {
          destinationId: d.id,
          label: stat.label,
          value: stat.value,
          unit: stat.unit || null,
          displayOrder: i
        }
      });
    }
  }
  console.log(`  ✓ ${destinations.length} destinations seeded\n`);

  // ============ USERS (for agents) ============
  console.log('→ Seeding agent users...');
  for (const a of agents) {
    const userEmail = `${a.slug}@coastalcorridor.co`;
    const user = await prisma.user.upsert({
      where: { email: userEmail },
      update: {},
      create: {
        email: userEmail,
        role: 'AGENT',
        status: 'ACTIVE',
        emailVerified: new Date(),
        profile: {
          create: {
            firstName: a.name.split(' ')[0],
            lastName: a.name.split(' ').slice(1).join(' '),
            avatar: a.avatar,
            bio: a.bio
          }
        },
        agentProfile: {
          create: {
            licenseNumber: a.licenseNumber,
            licenseVerified: a.licenseVerified,
            agencyName: a.agencyName,
            yearsActive: a.yearsActive,
            specialties: a.specialties,
            regionsCovered: a.regionsCovered,
            rating: a.rating,
            reviewCount: a.reviewCount
          }
        }
      }
    });
  }
  console.log(`  ✓ ${agents.length} agents seeded\n`);

  // ============ DEVELOPERS ============
  console.log('→ Seeding developers...');
  for (const d of developers) {
    const userEmail = `${d.slug}@coastalcorridor.co`;
    await prisma.user.upsert({
      where: { email: userEmail },
      update: {},
      create: {
        email: userEmail,
        role: 'DEVELOPER',
        status: 'ACTIVE',
        emailVerified: new Date(),
        profile: {
          create: {
            firstName: d.name.split(' ')[0],
            lastName: d.name.split(' ').slice(1).join(' ') || 'Properties'
          }
        },
        devProfile: {
          create: {
            companyName: d.name,
            cacNumber: d.cacNumber,
            yearFounded: d.yearFounded,
            description: d.description,
            projectCount: d.projectCount,
            verified: d.verified
          }
        }
      }
    });
  }
  console.log(`  ✓ ${developers.length} developers seeded\n`);

  // ============ PLOTS + PROPERTIES + LISTINGS ============
  console.log('→ Seeding plots, properties, listings...');
  for (const p of properties) {
    // Find the agent user
    const agentUser = p.agentName
      ? await prisma.user.findFirst({
          where: { profile: { firstName: p.agentName.split(' ')[0] } },
          include: { agentProfile: true }
        })
      : null;

    // Create the plot
    const plot = await prisma.plot.upsert({
      where: { plotId: p.plotId },
      update: {},
      create: {
        plotId: p.plotId,
        destinationId: p.destinationId,
        status: 'AVAILABLE',
        latitude: p.latitude,
        longitude: p.longitude,
        areaSqm: p.areaSqm,
        pricePerSqm: BigInt(p.pricePerSqmKobo),
        totalPrice: BigInt(p.priceKobo),
        currency: p.currency,
        titleStatus: p.titleStatus as any,
        titleType: p.titleType as any,
        floodRiskScore: p.floodRiskScore,
        disputeRiskScore: p.disputeRiskScore,
        titleVerifiedAt: p.titleStatus === 'VERIFIED' ? new Date() : null
      }
    });

    // Create the property
    const property = await prisma.property.upsert({
      where: { plotId: plot.id },
      update: {},
      create: {
        plotId: plot.id,
        type: p.type as any,
        title: p.title,
        description: p.description,
        bedrooms: p.bedrooms,
        bathrooms: p.bathrooms,
        floorArea: p.floorArea,
        yearBuilt: p.yearBuilt,
        amenities: p.amenities,
        heroImage: p.heroImage,
        images: p.images,
        virtualTourUrl: p.virtualTourUrl
      }
    });

    // Create the listing
    if (agentUser?.agentProfile) {
      await prisma.listing.create({
        data: {
          status: 'ACTIVE',
          plotId: plot.id,
          propertyId: property.id,
          ownerId: agentUser.id,
          agentId: agentUser.agentProfile.id,
          askingPriceKobo: BigInt(p.priceKobo),
          currency: p.currency,
          description: p.description,
          featured: p.featured ?? false
        }
      });
    }
  }
  console.log(`  ✓ ${properties.length} properties seeded\n`);

  console.log('🎉 Seed complete.\n');
  console.log('Next steps:');
  console.log('  1. npm run dev — start the app');
  console.log('  2. Open http://localhost:3000');
  console.log('  3. Sign up as admin to access /admin routes');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
