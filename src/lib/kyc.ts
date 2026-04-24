/**
 * KYC — Smile Identity Integration
 *
 * Supports NIN, BVN, and passport verification for Nigerian and diaspora buyers.
 * Falls back to a mock flow when SMILE_PARTNER_ID / SMILE_API_KEY are not set.
 *
 * PRODUCTION REQUIREMENTS:
 * - Set SMILE_PARTNER_ID and SMILE_API_KEY in Vercel environment variables
 * - All KYC data must be encrypted at rest (Supabase RLS enforced)
 * - Compliance with NDPR (Nigerian Data Protection Regulation) required
 * - Regular security audits of KYC data handling
 *
 * Smile Identity Web API v2 docs:
 * https://docs.usesmileid.com/server-to-server/javascript/web-api-v2
 */

export type KycIdType = 'NIN' | 'BVN' | 'PASSPORT' | 'DRIVERS_LICENSE' | 'VOTER_ID';

export interface KYCVerificationRequest {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string; // YYYY-MM-DD
  idType: KycIdType;
  idNumber: string;
  country?: string; // ISO 2-letter, default 'NG'
}

export interface KYCVerificationResult {
  verified: boolean;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVIEW';
  verificationId: string;
  smileJobId?: string;
  message?: string;
  timestamp: Date;
}

const SMILE_PARTNER_ID = process.env.SMILE_PARTNER_ID;
const SMILE_API_KEY = process.env.SMILE_API_KEY;
const SMILE_BASE_URL = process.env.SMILE_BASE_URL || 'https://testapi.smileidentity.com/v1';
const SMILE_CALLBACK_URL = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/kyc`;

function hasCreds(): boolean {
  return !!(SMILE_PARTNER_ID && SMILE_API_KEY);
}

/**
 * Initiate a KYC verification via Smile Identity.
 * Returns a PENDING result immediately; the final result arrives via webhook.
 */
export async function initiateKYCVerification(
  request: KYCVerificationRequest
): Promise<KYCVerificationResult> {
  const verificationId = `KYC-${Date.now().toString(36).toUpperCase()}-${request.userId.slice(-6).toUpperCase()}`;

  if (!hasCreds()) {
    console.warn('[KYC] Smile Identity credentials not set — using mock flow');
    return {
      verified: false,
      status: 'PENDING',
      verificationId,
      message: 'KYC verification initiated. You will be notified of the outcome within 24 hours.',
      timestamp: new Date(),
    };
  }

  try {
    const payload = {
      partner_id: SMILE_PARTNER_ID,
      timestamp: new Date().toISOString(),
      signature: await generateSmileSignature(),
      smile_client_id: verificationId,
      callback_url: SMILE_CALLBACK_URL,
      partner_params: {
        user_id: request.userId,
        job_id: verificationId,
        job_type: 5, // Enhanced KYC (no selfie required)
      },
      id_info: {
        first_name: request.firstName,
        last_name: request.lastName,
        phone_number: request.phone || '',
        dob: request.dateOfBirth || '',
        country: request.country || 'NG',
        id_type: request.idType,
        id_number: request.idNumber,
        entered: true,
      },
    };

    const res = await fetch(`${SMILE_BASE_URL}/id_verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Smile Identity API error: ${res.status} — ${err}`);
    }

    const data = await res.json();
    const approved = data.ResultCode === '1012'; // 1012 = Exact Match

    return {
      verified: approved,
      status: approved ? 'APPROVED' : 'PENDING',
      verificationId,
      smileJobId: data.SmileJobID,
      message: data.ResultText || 'Verification submitted',
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('[KYC] Smile Identity API call failed:', error);
    return {
      verified: false,
      status: 'PENDING',
      verificationId,
      message: 'Verification submitted. You will be notified of the outcome within 24 hours.',
      timestamp: new Date(),
    };
  }
}

/**
 * Check the status of an existing KYC verification.
 */
export async function checkKYCStatus(verificationId: string): Promise<KYCVerificationResult> {
  if (!hasCreds()) {
    return {
      verified: false,
      status: 'PENDING',
      verificationId,
      message: 'Verification in progress',
      timestamp: new Date(),
    };
  }

  try {
    const res = await fetch(
      `${SMILE_BASE_URL}/job_status?smile_client_id=${verificationId}&partner_id=${SMILE_PARTNER_ID}`,
      { headers: { Authorization: `Bearer ${SMILE_API_KEY}` } }
    );

    if (!res.ok) throw new Error(`Status check failed: ${res.status}`);
    const data = await res.json();

    const approved = data.job_complete && data.result?.ResultCode === '1012';
    return {
      verified: approved,
      status: approved ? 'APPROVED' : data.job_complete ? 'REJECTED' : 'PENDING',
      verificationId,
      smileJobId: data.SmileJobID,
      message: data.result?.ResultText || 'Status retrieved',
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('[KYC] Status check failed:', error);
    return {
      verified: false,
      status: 'PENDING',
      verificationId,
      message: 'Status check failed — please try again',
      timestamp: new Date(),
    };
  }
}

/**
 * Generate HMAC-SHA256 signature for Smile Identity requests.
 */
async function generateSmileSignature(): Promise<string> {
  const timestamp = new Date().toISOString();
  const message = `${timestamp}:${SMILE_PARTNER_ID}:smile_client_id`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(SMILE_API_KEY!),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  return Buffer.from(sig).toString('base64');
}

// =========================================================
// VALIDATION HELPERS
// =========================================================

export function validateNIN(nin: string): boolean {
  return /^\d{11}$/.test(nin.trim());
}

export function validateBVN(bvn: string): boolean {
  return /^\d{11}$/.test(bvn.trim());
}

export function validatePhoneNumber(phone: string): boolean {
  return /^(\+234|0)[0-9]{10}$/.test(phone.trim());
}

export function getKYCWebhookUrl(): string {
  return SMILE_CALLBACK_URL;
}
