import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient | null };

// Create a mock Prisma client if DATABASE_URL is not configured
const createPrismaClient = () => {
  if (!process.env.DATABASE_URL) {
    console.warn('⚠️ DATABASE_URL not configured. Database operations will fail at runtime.');
    // Return a proxy that throws errors when methods are called
    return new Proxy({} as any, {
      get: () => async () => {
        throw new Error('Database not configured. Please set DATABASE_URL environment variable.');
      },
    });
  }

  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
};

export const prisma =
  globalForPrisma.prisma ||
  createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
