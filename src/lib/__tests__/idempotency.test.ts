/**
 * Unit tests for src/lib/idempotency.ts
 *
 * Covers:
 *   - generateIdempotencyKey: returns a valid UUID v4
 *   - checkIdempotencyCache: returns hit=false when no DB (graceful degradation)
 *   - checkIdempotencyCache: returns hit=false on cache miss
 *   - checkIdempotencyCache: returns hit=true with cached response on cache hit
 *   - checkIdempotencyCache: returns hit=false for expired records
 *   - storeIdempotencyResponse: calls upsert with correct data
 *   - storeIdempotencyResponse: no-ops gracefully when no DB
 *
 * The Prisma client is mocked because idempotency.ts imports getPrisma() from
 * db-safe.ts, which requires a live DATABASE_URL.
 *
 * NOTE: idempotency.ts reads process.env at function call time (not module load),
 * so vi.mock() is sufficient without vi.resetModules().
 *
 * The cache hit test mocks findUnique to return a record where responseBody is
 * a Buffer (as stored in PostgreSQL Bytes column), matching the actual code path.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ─── Mock db-safe ─────────────────────────────────────────────────────────────
vi.mock('@/lib/db-safe', () => ({
  getPrisma: vi.fn(),
}));

// ─── generateIdempotencyKey ───────────────────────────────────────────────────

describe('generateIdempotencyKey', () => {
  it('returns a valid UUID v4 string', async () => {
    const { generateIdempotencyKey } = await import('../idempotency');
    const key = generateIdempotencyKey();
    // UUID v4 pattern: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    expect(key).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });

  it('generates unique keys on each call', async () => {
    const { generateIdempotencyKey } = await import('../idempotency');
    const keys = new Set(Array.from({ length: 100 }, () => generateIdempotencyKey()));
    expect(keys.size).toBe(100);
  });
});

// ─── checkIdempotencyCache — no DB ────────────────────────────────────────────

describe('checkIdempotencyCache — no database', () => {
  beforeEach(async () => {
    const { getPrisma } = await import('@/lib/db-safe');
    vi.mocked(getPrisma).mockReturnValue(null);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns hit=false when getPrisma() returns null', async () => {
    const { checkIdempotencyCache } = await import('../idempotency');
    const result = await checkIdempotencyCache('key-1', '/api/v1/test', 'body-hash');
    expect(result.hit).toBe(false);
  });
});

// ─── checkIdempotencyCache — cache miss ───────────────────────────────────────

describe('checkIdempotencyCache — cache miss', () => {
  const mockPrisma = {
    idempotencyCache: {
      findUnique: vi.fn().mockResolvedValue(null),
    },
  };

  beforeEach(async () => {
    const { getPrisma } = await import('@/lib/db-safe');
    vi.mocked(getPrisma).mockReturnValue(mockPrisma as never);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns hit=false when no record exists in the cache', async () => {
    const { checkIdempotencyCache } = await import('../idempotency');
    const result = await checkIdempotencyCache('key-miss', '/api/v1/test', 'hash-miss');
    expect(result.hit).toBe(false);
    expect(mockPrisma.idempotencyCache.findUnique).toHaveBeenCalledOnce();
  });
});

// ─── checkIdempotencyCache — cache hit ────────────────────────────────────────

describe('checkIdempotencyCache — cache hit', () => {
  // responseBody is stored as a Buffer (Prisma Bytes type) in the DB
  const cachedResponseBody = { id: 'created-resource' };
  const cachedRecord = {
    id: 'cache-record-id',
    idempotencyKey: 'key-hit',
    endpointPath: '/api/v1/test',
    bodyHash: 'hash-hit',
    responseStatus: 201,
    responseBody: Buffer.from(JSON.stringify(cachedResponseBody), 'utf8'),
    expiresAt: new Date(Date.now() + 86400 * 1000), // expires tomorrow
    createdAt: new Date(),
  };

  const mockPrisma = {
    idempotencyCache: {
      findUnique: vi.fn().mockResolvedValue(cachedRecord),
    },
  };

  beforeEach(async () => {
    const { getPrisma } = await import('@/lib/db-safe');
    vi.mocked(getPrisma).mockReturnValue(mockPrisma as never);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns hit=true with the cached response', async () => {
    const { checkIdempotencyCache } = await import('../idempotency');
    const result = await checkIdempotencyCache('key-hit', '/api/v1/test', 'hash-hit');
    expect(result.hit).toBe(true);
    expect(result.responseStatus).toBe(201);
    expect(result.responseBody).toEqual(cachedResponseBody);
  });
});

// ─── checkIdempotencyCache — expired record ───────────────────────────────────

describe('checkIdempotencyCache — expired record', () => {
  const expiredRecord = {
    id: 'expired-record',
    idempotencyKey: 'key-expired',
    endpointPath: '/api/v1/test',
    bodyHash: 'hash-expired',
    responseStatus: 200,
    responseBody: Buffer.from(JSON.stringify({}), 'utf8'),
    expiresAt: new Date(Date.now() - 1000), // expired 1 second ago
    createdAt: new Date(),
  };

  const mockPrisma = {
    idempotencyCache: {
      findUnique: vi.fn().mockResolvedValue(expiredRecord),
    },
  };

  beforeEach(async () => {
    const { getPrisma } = await import('@/lib/db-safe');
    vi.mocked(getPrisma).mockReturnValue(mockPrisma as never);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns hit=false for an expired cache record', async () => {
    const { checkIdempotencyCache } = await import('../idempotency');
    const result = await checkIdempotencyCache('key-expired', '/api/v1/test', 'hash-expired');
    expect(result.hit).toBe(false);
  });
});

// ─── storeIdempotencyResponse ─────────────────────────────────────────────────

describe('storeIdempotencyResponse', () => {
  const mockPrisma = {
    idempotencyCache: {
      upsert: vi.fn().mockResolvedValue({}),
    },
  };

  beforeEach(async () => {
    const { getPrisma } = await import('@/lib/db-safe');
    vi.mocked(getPrisma).mockReturnValue(mockPrisma as never);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('calls upsert with the correct data', async () => {
    const { storeIdempotencyResponse } = await import('../idempotency');
    await storeIdempotencyResponse('key-store', '/api/v1/test', 'hash-store', 200, { ok: true });
    expect(mockPrisma.idempotencyCache.upsert).toHaveBeenCalledOnce();
    const call = mockPrisma.idempotencyCache.upsert.mock.calls[0][0];
    expect(call.create.idempotencyKey).toBe('key-store');
    expect(call.create.responseStatus).toBe(200);
  });

  it('no-ops gracefully when getPrisma() returns null', async () => {
    const { getPrisma } = await import('@/lib/db-safe');
    vi.mocked(getPrisma).mockReturnValue(null);
    const { storeIdempotencyResponse } = await import('../idempotency');
    // Should not throw
    await expect(
      storeIdempotencyResponse('key-null', '/api/v1/test', 'hash-null', 200, {})
    ).resolves.toBeUndefined();
  });
});
