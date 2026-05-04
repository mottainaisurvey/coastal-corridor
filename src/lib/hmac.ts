/**
 * HMAC Signing Utility — Phase A
 *
 * Handles:
 *   1. Signing outbound requests to Owambe (X-CC-Signature header)
 *   2. Verifying inbound Owambe webhook signatures (X-Owambe-Signature header)
 *
 * Algorithm: HMAC-SHA256, hex-encoded
 * Shared secrets stored in environment variables — never logged or exposed.
 *
 * Spec reference: Implementation Brief §12, API Narrative §7
 */

import { createHmac, timingSafeEqual } from 'crypto';

// ─── Constants ────────────────────────────────────────────────────────────────

const OUTBOUND_SECRET = process.env.OWAMBE_SIGNING_SECRET;
const INBOUND_SECRET = process.env.OWAMBE_WEBHOOK_SECRET;

// ─── Outbound: sign a request body before sending to Owambe ──────────────────

/**
 * Produces the X-CC-Signature header value for an outbound request to Owambe.
 *
 * The signature is computed over:
 *   timestamp + "." + body (stringified)
 *
 * @param body - The raw JSON string of the request body
 * @param timestamp - Unix timestamp in seconds (default: now)
 * @returns { signature, timestamp } — both must be sent as headers
 */
export function signOutboundRequest(
  body: string,
  timestamp?: number
): { signature: string; timestamp: number } {
  if (!OUTBOUND_SECRET) {
    throw new Error(
      'OWAMBE_SIGNING_SECRET is not configured. Set it in your environment variables.'
    );
  }

  const ts = timestamp ?? Math.floor(Date.now() / 1000);
  const payload = `${ts}.${body}`;
  const signature = createHmac('sha256', OUTBOUND_SECRET)
    .update(payload, 'utf8')
    .digest('hex');

  return { signature, timestamp: ts };
}

/**
 * Builds the full set of headers required for an outbound Owambe API call.
 * Merges signing headers into the provided base headers.
 */
export function buildOwambeHeaders(
  body: string,
  idempotencyKey: string,
  extraHeaders?: Record<string, string>
): Record<string, string> {
  const { signature, timestamp } = signOutboundRequest(body);

  return {
    'Content-Type': 'application/json',
    'X-CC-Signature': signature,
    'X-CC-Timestamp': String(timestamp),
    'X-Idempotency-Key': idempotencyKey,
    ...extraHeaders,
  };
}

// ─── Inbound: verify Owambe webhook signature ─────────────────────────────────

/**
 * Verifies the X-Owambe-Signature header on an inbound webhook from Owambe.
 *
 * Uses timing-safe comparison to prevent timing attacks.
 *
 * @param rawBody - The raw request body as a Buffer or string (before JSON.parse)
 * @param receivedSignature - The value of the X-Owambe-Signature header
 * @param timestamp - The value of the X-Owambe-Timestamp header (Unix seconds)
 * @param toleranceSeconds - Max age of the webhook before rejection (default: 300s)
 * @returns true if valid, false otherwise
 */
export function verifyInboundWebhook(
  rawBody: Buffer | string,
  receivedSignature: string,
  timestamp: string,
  toleranceSeconds = 300
): boolean {
  if (!INBOUND_SECRET) {
    throw new Error(
      'OWAMBE_WEBHOOK_SECRET is not configured. Set it in your environment variables.'
    );
  }

  // Reject stale webhooks
  const ts = parseInt(timestamp, 10);
  if (isNaN(ts)) return false;

  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - ts) > toleranceSeconds) {
    return false;
  }

  const bodyStr =
    typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');
  const payload = `${timestamp}.${bodyStr}`;

  const expected = createHmac('sha256', INBOUND_SECRET)
    .update(payload, 'utf8')
    .digest('hex');

  // Timing-safe comparison
  try {
    return timingSafeEqual(
      Buffer.from(expected, 'hex'),
      Buffer.from(receivedSignature, 'hex')
    );
  } catch {
    // Buffer.from throws if hex strings are different lengths
    return false;
  }
}

// ─── Utility: generate a body hash for idempotency cache keys ─────────────────

import { createHash } from 'crypto';

/**
 * Produces a SHA-256 hex hash of the request body.
 * Used as part of the idempotency cache key.
 */
export function hashBody(body: string): string {
  return createHash('sha256').update(body, 'utf8').digest('hex');
}
