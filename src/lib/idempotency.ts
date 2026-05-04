/**
 * Idempotency Cache — Phase A
 *
 * Prevents duplicate outbound API calls to Owambe by caching responses
 * keyed on (idempotencyKey + endpointPath + bodyHash).
 *
 * Cache TTL: 7 days (matches Owambe's idempotency window per API contract).
 *
 * Storage: IdempotencyCache table in PostgreSQL (Prisma model added in Phase A schema).
 *
 * Usage pattern:
 *   1. Before calling Owambe, check the cache.
 *   2. If hit: return cached response immediately (no network call).
 *   3. If miss: make the call, store the response, return it.
 *
 * Spec reference: Implementation Brief §12, API Narrative §4
 */

import { createHash } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { getPrisma } from './db-safe';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface IdempotencyResult {
  hit: boolean;
  responseStatus?: number;
  responseBody?: unknown;
  idempotencyKey: string;
}

// ─── Key generation ───────────────────────────────────────────────────────────

/**
 * Generates a new UUID v4 idempotency key.
 * Call this once per logical operation and persist it before the first attempt.
 */
export function generateIdempotencyKey(): string {
  return uuidv4();
}

/**
 * Builds the cache record ID from the three components.
 */
function buildCacheId(
  idempotencyKey: string,
  endpointPath: string,
  bodyHash: string
): string {
  return createHash('sha256')
    .update(`${idempotencyKey}|${endpointPath}|${bodyHash}`)
    .digest('hex');
}

// ─── Cache read ───────────────────────────────────────────────────────────────

/**
 * Checks the idempotency cache for a prior response.
 * Returns the cached response if found and not expired.
 */
export async function checkIdempotencyCache(
  idempotencyKey: string,
  endpointPath: string,
  bodyHash: string
): Promise<IdempotencyResult> {
  const prisma = getPrisma();
  if (!prisma) {
    // Database not connected — skip cache, allow call through
    return { hit: false, idempotencyKey };
  }

  const cacheId = buildCacheId(idempotencyKey, endpointPath, bodyHash);

  try {
    const record = await prisma.idempotencyCache.findUnique({
      where: { id: cacheId },
    });

    if (!record) {
      return { hit: false, idempotencyKey };
    }

    // Check expiry
    if (record.expiresAt < new Date()) {
      // Expired — treat as miss (background cleanup handles deletion)
      return { hit: false, idempotencyKey };
    }

    return {
      hit: true,
      responseStatus: record.responseStatus,
      responseBody: JSON.parse(record.responseBody.toString('utf8')),
      idempotencyKey,
    };
  } catch (err) {
    // Cache read failure must never block the main flow
    console.error('[idempotency] Cache read error:', err);
    return { hit: false, idempotencyKey };
  }
}

// ─── Cache write ──────────────────────────────────────────────────────────────

/**
 * Stores a successful Owambe API response in the idempotency cache.
 * TTL: 7 days from now.
 */
export async function storeIdempotencyResponse(
  idempotencyKey: string,
  endpointPath: string,
  bodyHash: string,
  responseStatus: number,
  responseBody: unknown
): Promise<void> {
  const prisma = getPrisma();
  if (!prisma) return;

  const cacheId = buildCacheId(idempotencyKey, endpointPath, bodyHash);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  try {
    await prisma.idempotencyCache.upsert({
      where: { id: cacheId },
      create: {
        id: cacheId,
        idempotencyKey,
        endpointPath,
        bodyHash,
        responseStatus,
        responseBody: Buffer.from(JSON.stringify(responseBody), 'utf8'),
        expiresAt,
      },
      update: {
        responseStatus,
        responseBody: Buffer.from(JSON.stringify(responseBody), 'utf8'),
        expiresAt,
      },
    });
  } catch (err) {
    // Cache write failure must never block the main flow
    console.error('[idempotency] Cache write error:', err);
  }
}

// ─── Cache cleanup ────────────────────────────────────────────────────────────

/**
 * Deletes expired idempotency cache entries.
 * Called by the Vercel cron job at /api/cron/cleanup-idempotency-cache.
 */
export async function pruneExpiredIdempotencyCache(): Promise<number> {
  const prisma = getPrisma();
  if (!prisma) return 0;

  const result = await prisma.idempotencyCache.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });

  return result.count;
}

// ─── Wrapped fetch with idempotency ──────────────────────────────────────────

import { hashBody, buildOwambeHeaders } from './hmac';

export interface OwambeCallOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  idempotencyKey: string;
  body?: Record<string, unknown>;
  extraHeaders?: Record<string, string>;
  timeoutMs?: number;
}

export interface OwambeCallResult<T = unknown> {
  status: number;
  data: T;
  fromCache: boolean;
  idempotencyKey: string;
}

/**
 * Makes an outbound call to the Owambe API with:
 *   - HMAC signing
 *   - Idempotency cache check/store
 *   - Retry-safe (idempotent by design)
 *   - Timeout enforcement
 *
 * @param path - Owambe API path, e.g. "/v1/channel/stays/reservations"
 * @param options - Call options including idempotencyKey and body
 */
export async function callOwambe<T = unknown>(
  path: string,
  options: OwambeCallOptions
): Promise<OwambeCallResult<T>> {
  const baseUrl = process.env.OWAMBE_API_BASE_URL;
  if (!baseUrl) {
    throw new Error('OWAMBE_API_BASE_URL is not configured.');
  }

  const method = options.method ?? 'POST';
  const bodyStr = options.body ? JSON.stringify(options.body) : '';
  const bHash = bodyStr ? hashBody(bodyStr) : 'empty';

  // Check idempotency cache first
  const cached = await checkIdempotencyCache(
    options.idempotencyKey,
    path,
    bHash
  );
  if (cached.hit) {
    return {
      status: cached.responseStatus!,
      data: cached.responseBody as T,
      fromCache: true,
      idempotencyKey: options.idempotencyKey,
    };
  }

  // Build headers
  const headers = buildOwambeHeaders(
    bodyStr,
    options.idempotencyKey,
    {
      Authorization: `Bearer ${process.env.OWAMBE_API_KEY}`,
      ...options.extraHeaders,
    }
  );

  // Enforce timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    options.timeoutMs ?? 10_000
  );

  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method,
      headers,
      body: bodyStr || undefined,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }

  const data = (await response.json()) as T;

  // Cache successful responses (2xx) and idempotent error responses (4xx)
  if (response.status < 500) {
    await storeIdempotencyResponse(
      options.idempotencyKey,
      path,
      bHash,
      response.status,
      data
    );
  }

  return {
    status: response.status,
    data,
    fromCache: false,
    idempotencyKey: options.idempotencyKey,
  };
}
