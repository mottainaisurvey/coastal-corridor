/**
 * CC-C-05 — SmileIdentityAdapter unit tests
 *
 * AC-1: Adapter is a single class/module
 * AC-2: 6 env var slots present (SMILE_IDENTITY_MODE, SANDBOX_API_KEY, SANDBOX_PARTNER_ID,
 *        LIVE_API_KEY, LIVE_PARTNER_ID, CALLBACK_URL)
 * AC-3: Throws if SMILE_IDENTITY_MODE=live but SMILE_IDENTITY_LIVE_API_KEY is empty
 * AC-4: Application code does not branch on SMILE_IDENTITY_MODE outside adapter
 * AC-5: Startup log confirms mode
 * AC-6: initiateKYC() calls IDApi.submitAsyncjob with correct partner_params and id_info
 * AC-7: All 5 user types (STAYS_HOST, EXPERIENCES_OPERATOR, GUEST, AGENT, ADMIN) route
 *        through initiateKYC()
 * AC-8: mapResultCode() maps 1012→APPROVED, 1013→REVIEW, other→REJECTED, empty→PENDING
 * AC-9: mapIdType() maps all 5 KycIdType values to correct Smile id_type strings
 * AC-10: Singleton getSmileIdentityAdapter() returns same instance; reset works
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { _resetSmileIdentityAdapterForTesting } from '@/lib/smile-identity-adapter';

// ─── Mock smile-identity-core ─────────────────────────────────────────────────

const mockSubmitAsyncjob = vi.fn();

vi.mock('smile-identity-core', () => {
  class MockIDApi {
    constructor(
      public partner_id: string,
      public api_key: string,
      public sid_server: number
    ) {}
    submitAsyncjob = mockSubmitAsyncjob;
  }
  return {
    IDApi: MockIDApi,
    JOB_TYPE: {
      ENHANCED_KYC: 5,
    },
  };
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function setEnv(overrides: Record<string, string | undefined>) {
  for (const [k, v] of Object.entries(overrides)) {
    if (v === undefined) {
      delete process.env[k];
    } else {
      process.env[k] = v;
    }
  }
}

function sandboxEnv() {
  setEnv({
    SMILE_IDENTITY_MODE: 'sandbox',
    SMILE_IDENTITY_SANDBOX_API_KEY: 'test',
    SMILE_IDENTITY_SANDBOX_PARTNER_ID: '2019',
    SMILE_IDENTITY_LIVE_API_KEY: undefined,
    SMILE_IDENTITY_LIVE_PARTNER_ID: undefined,
    SMILE_IDENTITY_CALLBACK_URL: 'https://staging.coastalcorridor.africa/api/kyc/callback',
    NEXT_PUBLIC_APP_URL: 'https://staging.coastalcorridor.africa',
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  _resetSmileIdentityAdapterForTesting();
  sandboxEnv();
});

afterEach(() => {
  _resetSmileIdentityAdapterForTesting();
});

// ─── AC-1: Single class/module ────────────────────────────────────────────────

describe('AC-1: SmileIdentityAdapter class', () => {
  it('exports SmileIdentityAdapter class and getSmileIdentityAdapter factory', async () => {
    const mod = await import('@/lib/smile-identity-adapter');
    expect(typeof mod.SmileIdentityAdapter).toBe('function');
    expect(typeof mod.getSmileIdentityAdapter).toBe('function');
  });
});

// ─── AC-2: 6 env var slots ────────────────────────────────────────────────────

describe('AC-2: 6 environment variable slots', () => {
  it('reads SMILE_IDENTITY_MODE and sandbox credentials in sandbox mode', async () => {
    const { getSmileIdentityAdapter } = await import('@/lib/smile-identity-adapter');
    const adapter = getSmileIdentityAdapter();
    expect(adapter.getMode()).toBe('sandbox');
    expect(adapter.getPartnerId()).toBe('2019');
  });

  it('switches to live mode when SMILE_IDENTITY_MODE=live and live credentials are present', async () => {
    _resetSmileIdentityAdapterForTesting();
    setEnv({
      SMILE_IDENTITY_MODE: 'live',
      SMILE_IDENTITY_LIVE_API_KEY: 'live_api_key_abc',
      SMILE_IDENTITY_LIVE_PARTNER_ID: '9999',
      SMILE_IDENTITY_CALLBACK_URL: 'https://app.coastalcorridor.africa/api/kyc/callback',
    });
    const { getSmileIdentityAdapter } = await import('@/lib/smile-identity-adapter');
    const adapter = getSmileIdentityAdapter();
    expect(adapter.getMode()).toBe('live');
    expect(adapter.getPartnerId()).toBe('9999');
  });
});

// ─── AC-3: Startup validation ─────────────────────────────────────────────────

describe('AC-3: Startup validation', () => {
  it('throws if SMILE_IDENTITY_MODE=live but SMILE_IDENTITY_LIVE_API_KEY is empty', async () => {
    _resetSmileIdentityAdapterForTesting();
    setEnv({
      SMILE_IDENTITY_MODE: 'live',
      SMILE_IDENTITY_LIVE_API_KEY: undefined,
      SMILE_IDENTITY_LIVE_PARTNER_ID: '9999',
    });
    const { getSmileIdentityAdapter } = await import('@/lib/smile-identity-adapter');
    expect(() => getSmileIdentityAdapter()).toThrow(
      'SMILE_IDENTITY_MODE=live but SMILE_IDENTITY_LIVE_API_KEY is empty'
    );
  });

  it('throws if SMILE_IDENTITY_MODE=live but SMILE_IDENTITY_LIVE_PARTNER_ID is empty', async () => {
    _resetSmileIdentityAdapterForTesting();
    setEnv({
      SMILE_IDENTITY_MODE: 'live',
      SMILE_IDENTITY_LIVE_API_KEY: 'live_api_key_abc',
      SMILE_IDENTITY_LIVE_PARTNER_ID: undefined,
    });
    const { getSmileIdentityAdapter } = await import('@/lib/smile-identity-adapter');
    expect(() => getSmileIdentityAdapter()).toThrow(
      'SMILE_IDENTITY_MODE=live but SMILE_IDENTITY_LIVE_PARTNER_ID is empty'
    );
  });

  it('throws if SMILE_IDENTITY_MODE is invalid', async () => {
    _resetSmileIdentityAdapterForTesting();
    setEnv({ SMILE_IDENTITY_MODE: 'production' });
    const { getSmileIdentityAdapter } = await import('@/lib/smile-identity-adapter');
    expect(() => getSmileIdentityAdapter()).toThrow(
      'SMILE_IDENTITY_MODE must be "sandbox" or "live"'
    );
  });
});

// ─── AC-4: No SMILE_IDENTITY_MODE branching outside adapter ──────────────────

describe('AC-4: SMILE_IDENTITY_MODE isolation', () => {
  it('grep confirms SMILE_IDENTITY_MODE is only referenced in smile-identity-adapter.ts', async () => {
    const { execSync } = await import('child_process');
    const srcPath = `${process.cwd()}/src`;
    const result = execSync(
      `grep -r "SMILE_IDENTITY_MODE" ${srcPath} --include="*.ts" --include="*.tsx" -l`,
      { encoding: 'utf-8' }
    ).trim();
    const files = result.split('\n').filter(Boolean);
    const nonAdapterFiles = files.filter(
      (f) => !f.includes('smile-identity-adapter.ts') && !f.includes('.test.ts')
    );
    expect(nonAdapterFiles).toHaveLength(0);
  });
});

// ─── AC-5: Startup log ────────────────────────────────────────────────────────

describe('AC-5: Startup log', () => {
  it('logs [SmileIdentityAdapter] ... initialised in sandbox mode', async () => {
    const consoleSpy = vi.spyOn(console, 'info');
    const { getSmileIdentityAdapter } = await import('@/lib/smile-identity-adapter');
    getSmileIdentityAdapter();
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[SmileIdentityAdapter] Smile Identity adapter initialised in sandbox mode')
    );
  });
});

// ─── AC-6: initiateKYC calls IDApi.submitAsyncjob ────────────────────────────

describe('AC-6: initiateKYC()', () => {
  it('calls IDApi.submitAsyncjob with correct partner_params and id_info', async () => {
    mockSubmitAsyncjob.mockResolvedValue({
      SmileJobID: 'smile_job_001',
      ResultCode: '1012',
      ResultText: 'Exact Match',
    });

    const { getSmileIdentityAdapter } = await import('@/lib/smile-identity-adapter');
    const adapter = getSmileIdentityAdapter();

    const result = await adapter.initiateKYC({
      userId: 'user_abc123',
      userType: 'STAYS_HOST',
      firstName: 'Amara',
      lastName: 'Okonkwo',
      idType: 'NIN',
      idNumber: '12345678901',
      country: 'NG',
    });

    expect(mockSubmitAsyncjob).toHaveBeenCalledTimes(1);
    const [partnerParams, idInfo, callbackUrl] = mockSubmitAsyncjob.mock.calls[0];

    expect(partnerParams.user_id).toBe('user_abc123');
    expect(partnerParams.job_type).toBe(5); // ENHANCED_KYC
    expect(partnerParams.job_id).toMatch(/^KYC-/);

    expect(idInfo.first_name).toBe('Amara');
    expect(idInfo.last_name).toBe('Okonkwo');
    expect(idInfo.id_type).toBe('NIN');
    expect(idInfo.id_number).toBe('12345678901');
    expect(idInfo.country).toBe('NG');

    expect(callbackUrl).toBe('https://staging.coastalcorridor.africa/api/kyc/callback');

    expect(result.status).toBe('APPROVED');
    expect(result.verified).toBe(true);
    expect(result.smileJobId).toBe('smile_job_001');
  });

  it('returns PENDING when IDApi throws (graceful degradation)', async () => {
    mockSubmitAsyncjob.mockRejectedValue(new Error('Network error'));

    const { getSmileIdentityAdapter } = await import('@/lib/smile-identity-adapter');
    const adapter = getSmileIdentityAdapter();

    const result = await adapter.initiateKYC({
      userId: 'user_fail',
      userType: 'GUEST',
      firstName: 'Test',
      lastName: 'User',
      idType: 'BVN',
      idNumber: '12345678901',
    });

    expect(result.status).toBe('PENDING');
    expect(result.verified).toBe(false);
    expect(result.message).toContain('24 hours');
  });
});

// ─── AC-7: All 5 user types ───────────────────────────────────────────────────

describe('AC-7: All 5 user types route through initiateKYC()', () => {
  const userTypes = [
    'STAYS_HOST',
    'EXPERIENCES_OPERATOR',
    'GUEST',
    'AGENT',
    'ADMIN',
  ] as const;

  for (const userType of userTypes) {
    it(`accepts userType=${userType}`, async () => {
      mockSubmitAsyncjob.mockResolvedValue({
        SmileJobID: `smile_${userType}`,
        ResultCode: '',
        ResultText: 'Pending',
      });

      const { getSmileIdentityAdapter } = await import('@/lib/smile-identity-adapter');
      const adapter = getSmileIdentityAdapter();

      const result = await adapter.initiateKYC({
        userId: `user_${userType}`,
        userType,
        firstName: 'Test',
        lastName: 'User',
        idType: 'NIN',
        idNumber: '12345678901',
      });

      expect(result.verificationId).toMatch(/^KYC-/);
      expect(['PENDING', 'APPROVED', 'REJECTED', 'REVIEW']).toContain(result.status);
    });
  }
});

// ─── AC-8: mapResultCode ──────────────────────────────────────────────────────

describe('AC-8: mapResultCode()', () => {
  it('maps 1012 → APPROVED, verified=true', async () => {
    const { SmileIdentityAdapter } = await import('@/lib/smile-identity-adapter');
    const adapter = new SmileIdentityAdapter();
    expect(adapter.mapResultCode('1012')).toEqual({ status: 'APPROVED', verified: true });
  });

  it('maps 1013 → REVIEW, verified=false', async () => {
    const { SmileIdentityAdapter } = await import('@/lib/smile-identity-adapter');
    const adapter = new SmileIdentityAdapter();
    expect(adapter.mapResultCode('1013')).toEqual({ status: 'REVIEW', verified: false });
  });

  it('maps other code → REJECTED, verified=false', async () => {
    const { SmileIdentityAdapter } = await import('@/lib/smile-identity-adapter');
    const adapter = new SmileIdentityAdapter();
    expect(adapter.mapResultCode('1014')).toEqual({ status: 'REJECTED', verified: false });
    expect(adapter.mapResultCode('0000')).toEqual({ status: 'REJECTED', verified: false });
  });

  it('maps empty string → PENDING, verified=false', async () => {
    const { SmileIdentityAdapter } = await import('@/lib/smile-identity-adapter');
    const adapter = new SmileIdentityAdapter();
    expect(adapter.mapResultCode('')).toEqual({ status: 'PENDING', verified: false });
  });
});

// ─── AC-9: mapIdType ──────────────────────────────────────────────────────────

describe('AC-9: mapIdType()', () => {
  it('maps all 5 KycIdType values to correct Smile id_type strings', async () => {
    const { SmileIdentityAdapter } = await import('@/lib/smile-identity-adapter');
    const adapter = new SmileIdentityAdapter();

    expect(adapter.mapIdType('NIN')).toBe('NIN');
    expect(adapter.mapIdType('BVN')).toBe('BVN');
    expect(adapter.mapIdType('PASSPORT')).toBe('PASSPORT');
    expect(adapter.mapIdType('DRIVERS_LICENSE')).toBe('DRIVERS_LICENSE');
    expect(adapter.mapIdType('VOTER_ID')).toBe('VOTER_ID');
  });
});

// ─── AC-10: Singleton behaviour ───────────────────────────────────────────────

describe('AC-10: Singleton getSmileIdentityAdapter()', () => {
  it('returns the same instance on repeated calls', async () => {
    const { getSmileIdentityAdapter } = await import('@/lib/smile-identity-adapter');
    const a = getSmileIdentityAdapter();
    const b = getSmileIdentityAdapter();
    expect(a).toBe(b);
  });

  it('_resetSmileIdentityAdapterForTesting() clears the singleton', async () => {
    const { getSmileIdentityAdapter } = await import('@/lib/smile-identity-adapter');
    const a = getSmileIdentityAdapter();
    _resetSmileIdentityAdapterForTesting();
    const b = getSmileIdentityAdapter();
    // Both are valid instances but different objects after reset
    expect(a).not.toBe(b);
  });
});
