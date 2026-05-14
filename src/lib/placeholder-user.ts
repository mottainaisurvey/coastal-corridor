/**
 * Placeholder User creation helper — CC-D-01-C AC-1
 *
 * Creates or retrieves a Clerk-less User record for anonymous guest bookings.
 *
 * ── User Lifecycle ────────────────────────────────────────────────────────────
 *
 * Anonymous placeholder Users have clerkId=null and role=GUEST. They are
 * created at payment-initiation time from the BookingDraft's contact details.
 *
 * Future claim/merge path (NOT implemented here — Phase E):
 *   If a guest later signs up with the same email via Clerk, the D-1 webhook
 *   handler (src/app/api/webhooks/clerk/route.ts) should:
 *     1. Find the existing placeholder User by email
 *     2. Update clerkId to the new Clerk user ID
 *     3. Update role from GUEST to the appropriate role (HOST, OPERATOR, etc.)
 *     4. All prior ExperienceBooking records linked via participantUserId
 *        automatically become visible to the authenticated user.
 *
 * Operator-facing queries that join ExperienceBooking → User → display info
 * work transparently regardless of whether the User is placeholder or
 * authenticated, because the participantUserId FK is always populated.
 *
 * ── Phone uniqueness handling ─────────────────────────────────────────────────
 *
 * User.phone is @unique in the schema. To avoid conflicts when two different
 * guests share a phone number (unlikely but possible), we attempt to set phone
 * on creation but skip it if the email-based lookup returns an existing User
 * (phone already stored on that record). On creation, if a phone conflict
 * occurs (another User already has that phone), we create the placeholder
 * without a phone field rather than failing the booking.
 *
 * ── Idempotency ───────────────────────────────────────────────────────────────
 *
 * The helper is idempotent: if a User with the given email already exists
 * (placeholder or authenticated), it is returned as-is without modification.
 * This means two bookings from the same email address share one User record.
 */

import type { PrismaClient, User } from '@prisma/client';

export interface PlaceholderUserInput {
  email: string;
  displayName?: string;
  phone?: string;
}

/**
 * Finds an existing User by email, or creates a new placeholder User with
 * clerkId=null and role=GUEST.
 *
 * @param input    Guest contact details from BookingDraft
 * @param prisma   PrismaClient instance
 * @returns        The existing or newly-created User
 */
export async function createOrGetPlaceholderUser(
  input: PlaceholderUserInput,
  prisma: PrismaClient
): Promise<User> {
  const email = input.email.trim().toLowerCase();

  // ── AC-1a: Look up existing User by email ────────────────────────────────
  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing) {
    console.log(
      `[placeholder-user] found existing user id=${existing.id} ` +
      `clerkId=${existing.clerkId ?? 'null'} role=${existing.role}`
    );
    return existing;
  }

  // ── AC-1a: Create new placeholder User ───────────────────────────────────
  // Attempt with phone first; fall back to no phone on unique conflict.
  const phone = input.phone?.trim() || undefined;

  let created: User;
  try {
    created = await prisma.user.create({
      data: {
        clerkId: null,
        email,
        phone: phone ?? null,
        role: 'GUEST',
        status: 'ACTIVE', // placeholder Users are immediately active for booking
        // Profile fields
        // Note: User.profile is a separate Profile model; we don't create it here.
        // The displayName is stored on the Profile, not on User directly.
        // Guest display name is available via BookingDraft.guestName.
      },
    });
    console.log(
      `[placeholder-user] created placeholder user id=${created.id} ` +
      `email=${email} phone=${phone ?? 'null'}`
    );
  } catch (err: unknown) {
    // Phone unique constraint violation — retry without phone
    const isPhoneConflict =
      err instanceof Error &&
      err.message.includes('Unique constraint') &&
      err.message.includes('phone');

    if (isPhoneConflict) {
      console.warn(
        `[placeholder-user] phone unique conflict for phone=${phone}; ` +
        `creating placeholder without phone`
      );
      created = await prisma.user.create({
        data: {
          clerkId: null,
          email,
          phone: null,
          role: 'GUEST',
          status: 'ACTIVE',
        },
      });
      console.log(
        `[placeholder-user] created placeholder user (no phone) id=${created.id} email=${email}`
      );
    } else {
      throw err;
    }
  }

  return created;
}
