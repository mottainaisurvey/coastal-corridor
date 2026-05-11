/**
 * CC-C-05 Behavioural Evidence Run
 * Calls the real Smile Identity sandbox (partner_id=2019, api_key='test')
 * for all 5 user types using Enhanced KYC (job_type 5).
 *
 * Run: node /tmp/smile-evidence-run.mjs
 */
import { IDApi } from 'smile-identity-core';

const PARTNER_ID = '2019';
const API_KEY = 'test';
const SID_SERVER = 0; // 0 = sandbox
const CALLBACK_URL = 'https://coastal-corridor-staging-71v2f1t9v-owambe.vercel.app/api/kyc/callback';

// Canonical sandbox test data per user type
const userRuns = [
  {
    userType: 'STAYS_HOST',
    userId: 'cc-user-stays-host-001',
    firstName: 'Amara',
    lastName: 'Okonkwo',
    idType: 'NIN',
    idNumber: '12345678901',
    country: 'NG',
  },
  {
    userType: 'EXPERIENCES_OPERATOR',
    userId: 'cc-user-exp-op-001',
    firstName: 'Chidi',
    lastName: 'Eze',
    idType: 'PASSPORT',
    idNumber: 'A12345678',
    country: 'NG',
  },
  {
    userType: 'GUEST',
    userId: 'cc-user-guest-001',
    firstName: 'Ngozi',
    lastName: 'Adeyemi',
    idType: 'VOTER_ID',
    idNumber: '0987654321',
    country: 'NG',
  },
  {
    userType: 'AGENT',
    userId: 'cc-user-agent-001',
    firstName: 'Emeka',
    lastName: 'Nwosu',
    idType: 'DRIVERS_LICENSE',
    idNumber: 'DL12345678',
    country: 'NG',
  },
  {
    userType: 'ADMIN',
    userId: 'cc-user-admin-001',
    firstName: 'Funke',
    lastName: 'Balogun',
    idType: 'NIN',
    idNumber: '98765432101',
    country: 'NG',
  },
];

// AC-11: BVN path
const bvnRun = {
  userType: 'STAYS_HOST',
  userId: 'cc-user-bvn-001',
  firstName: 'Tunde',
  lastName: 'Adebayo',
  idType: 'BVN',
  idNumber: '12345678901',
  country: 'NG',
};

function buildVerificationId(userId) {
  return `KYC-${Date.now().toString(36).toUpperCase()}-${userId.slice(-6).toUpperCase()}`;
}

function mapResultCode(resultCode) {
  if (resultCode === '1012') return { status: 'APPROVED', verified: true };
  if (resultCode === '1013') return { status: 'REVIEW', verified: false };
  if (!resultCode) return { status: 'PENDING', verified: false };
  return { status: 'REJECTED', verified: false };
}

async function runKYC(run) {
  const verificationId = buildVerificationId(run.userId);
  const api = new IDApi(PARTNER_ID, API_KEY, SID_SERVER);

  const partnerParams = {
    user_id: run.userId,
    job_id: verificationId,
    job_type: 5, // ENHANCED_KYC
  };

  const idInfo = {
    first_name: run.firstName,
    last_name: run.lastName,
    phone_number: '',
    dob: '',
    country: run.country,
    id_type: run.idType,
    id_number: run.idNumber,
    entered: true,
  };

  const startTime = Date.now();
  let response;
  let error;

  try {
    response = await api.submitAsyncjob(partnerParams, idInfo, CALLBACK_URL);
  } catch (e) {
    error = e;
  }

  const durationMs = Date.now() - startTime;

  return {
    userType: run.userType,
    userId: run.userId,
    idType: run.idType,
    verificationId,
    durationMs,
    partnerParams,
    idInfo,
    response: response ?? null,
    error: error ? String(error.message ?? error) : null,
    resultCode: response ? String(response['ResultCode'] ?? '') : null,
    smileJobId: response ? response['SmileJobID'] : null,
    mappedStatus: response ? mapResultCode(String(response['ResultCode'] ?? '')) : { status: 'PENDING', verified: false },
  };
}

async function main() {
  console.log('=== CC-C-05 Smile Identity Sandbox Evidence Run ===');
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`Partner ID: ${PARTNER_ID} | SID Server: ${SID_SERVER} (sandbox)`);
  console.log(`Callback URL: ${CALLBACK_URL}`);
  console.log('');

  const allRuns = [...userRuns, bvnRun];
  const results = [];

  for (const run of allRuns) {
    console.log(`--- Running KYC for userType=${run.userType} idType=${run.idType} ---`);
    const result = await runKYC(run);
    results.push(result);

    console.log(`  verificationId: ${result.verificationId}`);
    console.log(`  SmileJobID:     ${result.smileJobId ?? '(none)'}`);
    console.log(`  ResultCode:     ${result.resultCode ?? '(none)'}`);
    console.log(`  MappedStatus:   ${result.mappedStatus.status}`);
    console.log(`  Error:          ${result.error ?? 'none'}`);
    console.log(`  Duration:       ${result.durationMs}ms`);
    console.log('');
  }

  console.log('=== FULL JSON EVIDENCE ===');
  console.log(JSON.stringify(results, null, 2));
}

main().catch(console.error);
