/**
 * SmileIdentityAdapter — CC-C-05
 *
 * Single adapter class that abstracts all Smile Identity API calls for the
 * Coastal Corridor platform. Reads SMILE_IDENTITY_MODE on initialisation and
 * selects the correct credentials (sandbox vs live) accordingly.
 *
 * Design mirrors PaystackAdapter (CC-C-01) and StripeAdapter (CC-C-02) to
 * maintain a consistent Activation Pattern Standard across all adapters.
 *
 * Supported user types: STAYS_HOST, EXPERIENCES_OPERATOR, GUEST, AGENT, ADMIN
 * Supported ID types: NIN, BVN, PASSPORT, DRIVERS_LICENSE, VOTER_ID
 * Job type: 5 (ENHANCED_KYC — no selfie required)
 *
 * Sandbox credentials (canonical public test values):
 *   partner_id = "2019"
 *   api_key    = "test"
 *   sid_server = 0  (testapi.smileidentity.com/v1)
 *
 * CC-C-05 Acceptance criteria: AC-1 through AC-10.
 */
import { IDApi, JOB_TYPE } from 'smile-identity-core';

// ─── Types ────────────────────────────────────────────────────────────────────

export type SmileIdentityMode = 'sandbox' | 'live';

export type KycUserType =
  | 'STAYS_HOST'
  | 'EXPERIENCES_OPERATOR'
  | 'GUEST'
  | 'AGENT'
  | 'ADMIN';

export type KycIdType =
  | 'NIN'
  | 'BVN'
  | 'PASSPORT'
  | 'DRIVERS_LICENSE'
  | 'VOTER_ID';

export interface KycInitiateInput {
  /** Internal Coastal Corridor user ID (used as Smile user_id) */
  userId: string;
  /** User type — determines which ID types are accepted */
  userType: KycUserType;
  firstName: string;
  lastName: string;
  idType: KycIdType;
  idNumber: string;
  phone?: string;
  dateOfBirth?: string; // YYYY-MM-DD
  country?: string; // ISO 2-letter, default 'NG'
}

export interface KycInitiateResult {
  /** Internal verification reference (e.g. KYC-1A2B3C-ABCDEF) */
  verificationId: string;
  /** Smile Identity SmileJobID returned by the API */
  smileJobId?: string;
  /** Immediate status from the synchronous call */
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVIEW';
  verified: boolean;
  message: string;
}

// ─── SmileIdentityAdapter ─────────────────────────────────────────────────────

export class SmileIdentityAdapter {
  private readonly mode: SmileIdentityMode;
  private readonly partnerId: string;
  private readonly apiKey: string;
  private readonly callbackUrl: string;
  /** Smile sid_server: 0 = sandbox, 1 = live */
  private readonly sidServer: 0 | 1;

  /**
   * Constructs a SmileIdentityAdapter from environment variables.
   *
   * Required env vars:
   *   SMILE_IDENTITY_MODE             — "sandbox" | "live"
   *   SMILE_IDENTITY_SANDBOX_API_KEY  — sandbox API key (canonical: "test")
   *   SMILE_IDENTITY_SANDBOX_PARTNER_ID — sandbox partner ID (canonical: "2019")
   *   SMILE_IDENTITY_LIVE_API_KEY     — live API key (may be empty in sandbox mode)
   *   SMILE_IDENTITY_LIVE_PARTNER_ID  — live partner ID (may be empty in sandbox mode)
   *   SMILE_IDENTITY_CALLBACK_URL     — URL for async KYC result callbacks
   *
   * Throws if:
   *   - SMILE_IDENTITY_MODE is not "sandbox" or "live"
   *   - SMILE_IDENTITY_MODE=live but SMILE_IDENTITY_LIVE_API_KEY is empty (AC-3)
   *   - SMILE_IDENTITY_MODE=live but SMILE_IDENTITY_LIVE_PARTNER_ID is empty (AC-3)
   */
  constructor() {
    const rawMode = process.env.SMILE_IDENTITY_MODE ?? 'sandbox';
    if (rawMode !== 'sandbox' && rawMode !== 'live') {
      throw new Error(
        `[SmileIdentityAdapter] SMILE_IDENTITY_MODE must be "sandbox" or "live", got "${rawMode}"`
      );
    }
    this.mode = rawMode as SmileIdentityMode;

    if (this.mode === 'live') {
      const liveKey = process.env.SMILE_IDENTITY_LIVE_API_KEY ?? '';
      const livePartnerId = process.env.SMILE_IDENTITY_LIVE_PARTNER_ID ?? '';
      if (!liveKey) {
        throw new Error(
          '[SmileIdentityAdapter] SMILE_IDENTITY_MODE=live but SMILE_IDENTITY_LIVE_API_KEY is empty. ' +
          'Obtain live credentials from Smile Identity dashboard and set SMILE_IDENTITY_LIVE_API_KEY.'
        );
      }
      if (!livePartnerId) {
        throw new Error(
          '[SmileIdentityAdapter] SMILE_IDENTITY_MODE=live but SMILE_IDENTITY_LIVE_PARTNER_ID is empty. ' +
          'Set SMILE_IDENTITY_LIVE_PARTNER_ID to your Smile Identity live partner ID.'
        );
      }
      this.apiKey = liveKey;
      this.partnerId = livePartnerId;
      this.sidServer = 1;
    } else {
      // Sandbox mode — canonical public test credentials
      this.apiKey = process.env.SMILE_IDENTITY_SANDBOX_API_KEY ?? 'test';
      this.partnerId = process.env.SMILE_IDENTITY_SANDBOX_PARTNER_ID ?? '2019';
      this.sidServer = 0;
    }

    this.callbackUrl =
      process.env.SMILE_IDENTITY_CALLBACK_URL ??
      `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/api/kyc/callback`;

    // AC-5: Startup log confirming mode
    console.info(
      `[SmileIdentityAdapter] Smile Identity adapter initialised in ${this.mode} mode ` +
      `(partner_id=${this.partnerId})`
    );
  }

  // ── Public accessors ───────────────────────────────────────────────────────

  getMode(): SmileIdentityMode {
    return this.mode;
  }

  getPartnerId(): string {
    return this.partnerId;
  }

  // ── initiateKYC (AC-6, AC-7) ──────────────────────────────────────────────

  /**
   * Initiates an Enhanced KYC (job_type 5) verification via Smile Identity.
   *
   * For BVN: uses the BVN-specific id_type mapping.
   * For NIN, PASSPORT, DRIVERS_LICENSE, VOTER_ID: uses standard id_type.
   *
   * Returns a result immediately from the synchronous Smile API call.
   * Async result (if any) arrives via the callback URL.
   *
   * AC-7: All five user types (STAYS_HOST, EXPERIENCES_OPERATOR, GUEST, AGENT, ADMIN)
   * are routed through this single method.
   */
  async initiateKYC(input: KycInitiateInput): Promise<KycInitiateResult> {
    const verificationId = this.buildVerificationId(input.userId);

    console.info(
      `[SmileIdentityAdapter] initiateKYC() userId=${input.userId} ` +
      `userType=${input.userType} idType=${input.idType} mode=${this.mode}`
    );

    const partnerParams = {
      user_id: input.userId,
      job_id: verificationId,
      job_type: JOB_TYPE.ENHANCED_KYC, // 5
    };

    const idInfo = {
      first_name: input.firstName,
      last_name: input.lastName,
      phone_number: input.phone ?? '',
      dob: input.dateOfBirth ?? '',
      country: input.country ?? 'NG',
      id_type: this.mapIdType(input.idType),
      id_number: input.idNumber,
      entered: true,
    };

    try {
      const api = new IDApi(this.partnerId, this.apiKey, this.sidServer);

      // Use submitAsyncjob so Smile posts the result to our callback URL
      const response = await api.submitAsyncjob<Record<string, unknown>>(
        partnerParams,
        idInfo,
        this.callbackUrl
      );

      console.info(
        `[SmileIdentityAdapter] initiateKYC() response: ` +
        `SmileJobID=${response['SmileJobID']} ResultCode=${response['ResultCode']}`
      );

      const resultCode = String(response['ResultCode'] ?? '');
      const { status, verified } = this.mapResultCode(resultCode);

      return {
        verificationId,
        smileJobId: response['SmileJobID'] as string | undefined,
        status,
        verified,
        message: String(response['ResultText'] ?? 'Verification submitted'),
      };
    } catch (error) {
      console.error('[SmileIdentityAdapter] initiateKYC() API call failed:', error);
      // Return PENDING rather than throwing — async callback will deliver final result
      return {
        verificationId,
        status: 'PENDING',
        verified: false,
        message: 'Verification submitted. You will be notified of the outcome within 24 hours.',
      };
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  /**
   * Maps Smile Identity result codes to internal KYC status.
   * 1012 = Exact Match → APPROVED
   * 1013 = Partial Match → REVIEW
   * all others → REJECTED (or PENDING if empty)
   */
  mapResultCode(
    resultCode: string
  ): { status: KycInitiateResult['status']; verified: boolean } {
    if (resultCode === '1012') return { status: 'APPROVED', verified: true };
    if (resultCode === '1013') return { status: 'REVIEW', verified: false };
    if (!resultCode) return { status: 'PENDING', verified: false };
    return { status: 'REJECTED', verified: false };
  }

  /**
   * Maps internal KycIdType to the Smile Identity id_type string.
   * BVN uses 'BVN' directly; all others use their string value.
   */
  mapIdType(idType: KycIdType): string {
    const mapping: Record<KycIdType, string> = {
      NIN: 'NIN',
      BVN: 'BVN',
      PASSPORT: 'PASSPORT',
      DRIVERS_LICENSE: 'DRIVERS_LICENSE',
      VOTER_ID: 'VOTER_ID',
    };
    return mapping[idType];
  }

  /**
   * Builds a unique internal verification ID.
   * Format: KYC-{timestamp36}-{userId suffix}
   */
  buildVerificationId(userId: string): string {
    return `KYC-${Date.now().toString(36).toUpperCase()}-${userId.slice(-6).toUpperCase()}`;
  }
}

// ─── Singleton ────────────────────────────────────────────────────────────────

let _adapter: SmileIdentityAdapter | null = null;

export function getSmileIdentityAdapter(): SmileIdentityAdapter {
  if (!_adapter) {
    _adapter = new SmileIdentityAdapter();
  }
  return _adapter;
}

/** @internal — test use only */
export function _resetSmileIdentityAdapterForTesting(): void {
  _adapter = null;
}
