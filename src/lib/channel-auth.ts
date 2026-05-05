/**
 * Channel Auth Middleware — Phase B
 *
 * Shared request-level guard for all inbound Owambe channel endpoints.
 * Enforces:
 *   1. HMAC-SHA256 signature verification (X-Owambe-Signature + X-Owambe-Timestamp)
 *   2. Replay-attack protection (5-minute timestamp tolerance)
 *   3. Idempotency key extraction and validation
 *
 * Usage:
 *   const guard = await verifyChannelRequest(req);
 *   if (guard.error) return guard.error;
 *   const { rawBody, idempotencyKey } = guard;
 *
 * Spec reference: Implementation Brief §10, §12
 */
import { NextRequest, NextResponse } from 'next/server';
import { verifyInboundWebhook } from '@/lib/hmac';

export interface ChannelGuardOk {
  error: null;
  rawBody: string;
  idempotencyKey: string;
}

export interface ChannelGuardFail {
  error: NextResponse;
  rawBody?: never;
  idempotencyKey?: never;
}

export type ChannelGuard = ChannelGuardOk | ChannelGuardFail;

/**
 * Verifies the HMAC signature and extracts the idempotency key from an
 * inbound Owambe channel request.
 *
 * Returns either { error: null, rawBody, idempotencyKey } on success,
 * or { error: NextResponse } on failure (caller should return the error response).
 */
export async function verifyChannelRequest(
  req: NextRequest
): Promise<ChannelGuard> {
  const rawBody = await req.text();

  const signature = req.headers.get('x-owambe-signature') ?? '';
  const timestamp = req.headers.get('x-owambe-timestamp') ?? '';
  const idempotencyKey = req.headers.get('x-idempotency-key') ?? '';

  // All three headers are required
  if (!signature || !timestamp || !idempotencyKey) {
    return {
      error: NextResponse.json(
        {
          error: 'Missing required headers',
          required: ['x-owambe-signature', 'x-owambe-timestamp', 'x-idempotency-key'],
        },
        { status: 400 }
      ),
    };
  }

  // Verify HMAC (timing-safe, 5-minute tolerance)
  let valid = false;
  try {
    valid = verifyInboundWebhook(rawBody, signature, timestamp);
  } catch (err) {
    console.error('[channel-auth] Signature verification error:', err);
    return {
      error: NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      ),
    };
  }

  if (!valid) {
    return {
      error: NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      ),
    };
  }

  return { error: null, rawBody, idempotencyKey };
}

/**
 * Parses the raw body as JSON.
 * Returns { data } on success or { parseError: NextResponse } on failure.
 */
export function parseBody<T = Record<string, unknown>>(
  rawBody: string
): { data: T; parseError: null } | { data: null; parseError: NextResponse } {
  try {
    return { data: JSON.parse(rawBody) as T, parseError: null };
  } catch {
    return {
      data: null,
      parseError: NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      ),
    };
  }
}
