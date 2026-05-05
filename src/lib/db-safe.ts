/**
 * Safe database wrapper that handles initialization errors gracefully.
 * Used to prevent build-time errors when DATABASE_URL is not configured.
 *
 * IMPORTANT: DATABASE_URL is checked at *call time* (not module load time)
 * so that serverless functions always pick up the runtime environment variable
 * rather than the build-time snapshot.
 */

import { PrismaClient } from '@prisma/client';

let prismaInstance: PrismaClient | null = null;

export function getPrismaClient(): PrismaClient | null {
  // Return existing instance if already initialised
  if (prismaInstance) {
    return prismaInstance;
  }

  // Check at call time — Vercel injects env vars at runtime for dynamic routes
  if (!process.env.DATABASE_URL) {
    console.warn('⚠️ DATABASE_URL not configured. Database operations will fail at runtime.');
    return null;
  }

  try {
    prismaInstance = new PrismaClient();
    return prismaInstance;
  } catch (error) {
    console.error('Failed to initialize Prisma client:', error);
    return null;
  }
}

// Alias used by Phase A/B integration files
export const getPrisma = getPrismaClient;

export const prisma = new Proxy({} as any, {
  get: (_target, prop) => {
    const client = getPrismaClient();
    if (!client) {
      return async () => {
        throw new Error('Database not configured. Please set DATABASE_URL environment variable.');
      };
    }
    return (client as any)[prop];
  },
});
