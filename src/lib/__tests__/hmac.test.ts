/**
 * Unit tests for src/lib/hmac.ts
 *
 * Covers:
 *   - signOutboundRequest: correct signature produced, deterministic for same ts
 *   - buildOwambeHeaders: all required headers present
 *   - verifyInboundWebhook: valid signature passes, invalid fails, stale timestamp rejected
 *   - hashBody: consistent SHA-256 output
 *
 * IMPORTANT: hmac.ts reads OWAMBE_SIGNING_SECRET and OWAMBE_WEBHOOK_SECRET at
 * module load time (module-level constants). Tests that need different env var
 * values must call vi.resetModules() + vi.stubEnv() before re-importing.
 * Tests that only need the default secrets set can share a single import.
 */
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { createHmac } from 'crypto';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const OUTBOUND_SECRET = 'test-outbound-secret-32-bytes-ok!';
const INBOUND_SECRET = 'test-inbound-webhook-secret-32b!';

/** Produce the expected HMAC-SHA256 hex for a given secret, timestamp, and body. */
function expectedHmac(secret: string, timestamp: number, body: string): string {
  return createHmac('sha256', secret)
    .update(`${timestamp}.${body}`, 'utf8')
    .digest('hex');
}

// ─── signOutboundRequest ──────────────────────────────────────────────────────

describe('signOutboundRequest', () => {
  const body = JSON.stringify({ foo: 'bar' });

  beforeAll(() => {
    vi.resetModules();
    vi.stubEnv('OWAMBE_SIGNING_SECRET', OUTBOUND_SECRET);
    vi.stubEnv('OWAMBE_WEBHOOK_SECRET', INBOUND_SECRET);
  });

  afterAll(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('produces a hex HMAC-SHA256 signature', async () => {
    const { signOutboundRequest } = await import('../hmac');
    const ts = Math.floor(Date.now() / 1000);
    const { signature, timestamp } = signOutboundRequest(body, ts);
    expect(signature).toMatch(/^[0-9a-f]{64}$/);
    expect(timestamp).toBe(ts);
  });

  it('is deterministic: same body + timestamp → same signature', async () => {
    const { signOutboundRequest } = await import('../hmac');
    const ts = 1700000000;
    const { signature: sig1 } = signOutboundRequest(body, ts);
    const { signature: sig2 } = signOutboundRequest(body, ts);
    expect(sig1).toBe(sig2);
  });

  it('matches the expected HMAC value', async () => {
    const { signOutboundRequest } = await import('../hmac');
    const ts = 1700000000;
    const { signature } = signOutboundRequest(body, ts);
    const expected = expectedHmac(OUTBOUND_SECRET, ts, body);
    expect(signature).toBe(expected);
  });
});

// ─── signOutboundRequest — missing secret ─────────────────────────────────────

describe('signOutboundRequest — missing secret', () => {
  const body = JSON.stringify({ foo: 'bar' });

  beforeAll(() => {
    vi.resetModules();
    vi.stubEnv('OWAMBE_SIGNING_SECRET', '');
    vi.stubEnv('OWAMBE_WEBHOOK_SECRET', '');
  });

  afterAll(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('throws when OWAMBE_SIGNING_SECRET is not set', async () => {
    const { signOutboundRequest } = await import('../hmac');
    expect(() => signOutboundRequest(body)).toThrow(
      'OWAMBE_SIGNING_SECRET is not configured'
    );
  });
});

// ─── buildOwambeHeaders ───────────────────────────────────────────────────────

describe('buildOwambeHeaders', () => {
  const body = JSON.stringify({ action: 'test' });
  const idempotencyKey = 'idem-key-abc-123';

  beforeAll(() => {
    vi.resetModules();
    vi.stubEnv('OWAMBE_SIGNING_SECRET', OUTBOUND_SECRET);
    vi.stubEnv('OWAMBE_WEBHOOK_SECRET', INBOUND_SECRET);
  });

  afterAll(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('includes all required Owambe request headers', async () => {
    const { buildOwambeHeaders } = await import('../hmac');
    const headers = buildOwambeHeaders(body, idempotencyKey);
    expect(headers['Content-Type']).toBe('application/json');
    expect(headers['X-CC-Signature']).toMatch(/^[0-9a-f]{64}$/);
    expect(headers['X-CC-Timestamp']).toMatch(/^\d+$/);
    expect(headers['X-Idempotency-Key']).toBe(idempotencyKey);
  });

  it('merges extra headers without overwriting required ones', async () => {
    const { buildOwambeHeaders } = await import('../hmac');
    const headers = buildOwambeHeaders(body, idempotencyKey, {
      'X-Custom-Header': 'custom-value',
    });
    expect(headers['X-Custom-Header']).toBe('custom-value');
    expect(headers['Content-Type']).toBe('application/json');
  });
});

// ─── verifyInboundWebhook ─────────────────────────────────────────────────────

describe('verifyInboundWebhook', () => {
  const body = JSON.stringify({ event: 'reservation.confirmed', data: {} });

  beforeAll(() => {
    vi.resetModules();
    vi.stubEnv('OWAMBE_SIGNING_SECRET', OUTBOUND_SECRET);
    vi.stubEnv('OWAMBE_WEBHOOK_SECRET', INBOUND_SECRET);
  });

  afterAll(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('returns true for a valid signature within the tolerance window', async () => {
    const { verifyInboundWebhook } = await import('../hmac');
    const ts = Math.floor(Date.now() / 1000);
    const sig = expectedHmac(INBOUND_SECRET, ts, body);
    expect(verifyInboundWebhook(body, sig, String(ts))).toBe(true);
  });

  it('returns false for a signature computed with the wrong secret', async () => {
    const { verifyInboundWebhook } = await import('../hmac');
    const ts = Math.floor(Date.now() / 1000);
    const wrongSig = expectedHmac('wrong-secret', ts, body);
    expect(verifyInboundWebhook(body, wrongSig, String(ts))).toBe(false);
  });

  it('returns false for a tampered body', async () => {
    const { verifyInboundWebhook } = await import('../hmac');
    const ts = Math.floor(Date.now() / 1000);
    const sig = expectedHmac(INBOUND_SECRET, ts, body);
    const tamperedBody = body + ' ';
    expect(verifyInboundWebhook(tamperedBody, sig, String(ts))).toBe(false);
  });

  it('returns false for a timestamp older than the tolerance window (5 minutes)', async () => {
    const { verifyInboundWebhook } = await import('../hmac');
    const staleTs = Math.floor(Date.now() / 1000) - 400; // 6m40s ago
    const sig = expectedHmac(INBOUND_SECRET, staleTs, body);
    expect(verifyInboundWebhook(body, sig, String(staleTs))).toBe(false);
  });

  it('returns true for a timestamp within the tolerance window (4 minutes ago)', async () => {
    const { verifyInboundWebhook } = await import('../hmac');
    const recentTs = Math.floor(Date.now() / 1000) - 240; // 4 minutes ago
    const sig = expectedHmac(INBOUND_SECRET, recentTs, body);
    expect(verifyInboundWebhook(body, sig, String(recentTs))).toBe(true);
  });

  it('returns false for a non-numeric timestamp', async () => {
    const { verifyInboundWebhook } = await import('../hmac');
    expect(verifyInboundWebhook(body, 'any-sig', 'not-a-number')).toBe(false);
  });

  it('returns false when signatures are different lengths (prevents length extension)', async () => {
    const { verifyInboundWebhook } = await import('../hmac');
    const ts = Math.floor(Date.now() / 1000);
    // Truncated signature — different length from 64-char hex
    expect(verifyInboundWebhook(body, 'abc123', String(ts))).toBe(false);
  });
});

// ─── verifyInboundWebhook — missing secret ────────────────────────────────────

describe('verifyInboundWebhook — missing secret', () => {
  const body = JSON.stringify({ event: 'test', data: {} });

  beforeAll(() => {
    vi.resetModules();
    vi.stubEnv('OWAMBE_SIGNING_SECRET', '');
    vi.stubEnv('OWAMBE_WEBHOOK_SECRET', '');
  });

  afterAll(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('throws when OWAMBE_WEBHOOK_SECRET is not set', async () => {
    const { verifyInboundWebhook } = await import('../hmac');
    const ts = Math.floor(Date.now() / 1000);
    expect(() => verifyInboundWebhook(body, 'sig', String(ts))).toThrow(
      'OWAMBE_WEBHOOK_SECRET is not configured'
    );
  });
});

// ─── hashBody ─────────────────────────────────────────────────────────────────

describe('hashBody', () => {
  beforeAll(() => {
    vi.resetModules();
    vi.stubEnv('OWAMBE_SIGNING_SECRET', OUTBOUND_SECRET);
    vi.stubEnv('OWAMBE_WEBHOOK_SECRET', INBOUND_SECRET);
  });

  afterAll(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('produces a 64-character hex SHA-256 hash', async () => {
    const { hashBody } = await import('../hmac');
    const hash = hashBody('{"foo":"bar"}');
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('is deterministic: same input → same hash', async () => {
    const { hashBody } = await import('../hmac');
    expect(hashBody('hello')).toBe(hashBody('hello'));
  });

  it('produces different hashes for different inputs', async () => {
    const { hashBody } = await import('../hmac');
    expect(hashBody('hello')).not.toBe(hashBody('world'));
  });
});
