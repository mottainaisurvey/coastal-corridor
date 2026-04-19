/**
 * Safe database wrapper that handles initialization errors gracefully.
 * Used to prevent build-time errors when DATABASE_URL is not configured.
 */

import { PrismaClient } from '@prisma/client';

let prismaInstance: PrismaClient | null = null;

export function getPrismaClient() {
  if (prismaInstance) {
    return prismaInstance;
  }

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

export const prisma = new Proxy({} as any, {
  get: (target, prop) => {
    const client = getPrismaClient();
    if (!client) {
      return async () => {
        throw new Error('Database not configured. Please set DATABASE_URL environment variable.');
      };
    }
    return (client as any)[prop];
  },
});
