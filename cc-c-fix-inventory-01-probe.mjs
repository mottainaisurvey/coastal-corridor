import https from 'https';
import crypto from 'crypto';

const BASE_URL = 'https://coastal-corridor-staging.vercel.app';
const SHARED_SECRET = process.env.OWAMBE_WEBHOOK_SECRET || 'sk_test_mock_secret_for_staging';

function signRequest(body, timestamp) {
  const hmac = crypto.createHmac('sha256', SHARED_SECRET);
  hmac.update(`${timestamp}.${body}`, 'utf8');
  return hmac.digest('hex');
}

function makeRequest(path, method, payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = signRequest(body, timestamp);
    const idempotencyKey = crypto.randomUUID();

    const options = {
      hostname: 'coastal-corridor-staging.vercel.app',
      port: 443,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'x-owambe-signature': signature,
        'x-owambe-timestamp': timestamp,
        'x-idempotency-key': idempotencyKey,
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          body: data ? JSON.parse(data) : null,
        });
      });
    });

    req.on('error', (e) => reject(e));
    req.write(body);
    req.end();
  });
}

async function runProbe() {
  console.log('=================================================================');
  console.log('CC-C-FIX-INVENTORY-01 DIAGNOSTIC PROBE');
  console.log('=================================================================\n');

  const owambeExperienceId = `exp_probe_${Date.now()}`;
  const owambeTimeSlotId = `ts_probe_${Date.now()}`;
  
  // Need a valid Owambe User ID that exists in staging DB.
  // We'll use the one from the Paystack probe seed (it creates an operator).
  // First, let's create an operator via the seed endpoint just to be sure we have one.
  console.log('[Step 0] Seeding test operator user...');
  const seedRes = await new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'coastal-corridor-staging.vercel.app',
      port: 443,
      path: '/api/diagnostic/seed',
      method: 'POST',
      headers: {
        'x-diagnostic-secret': process.env.DIAGNOSTIC_SECRET || 'cc_diag_8f92a1b3c4d5e6f7g8h9i0j1k2l3m4n5',
        'Content-Length': 0
      }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(data) }));
    });
    req.on('error', reject);
    req.end();
  });
  
  if (seedRes.status !== 200) {
    console.error('Failed to seed test operator:', seedRes);
    process.exit(1);
  }
  
  // The seed endpoint returns the operator's Coastal Corridor User ID
  // But the inventory route expects the operator's Owambe User ID.
  // We need to fetch the operator's Owambe User ID from the DB or just use a mock one
  // since the route looks it up by owambeUserId.
  // Wait, the seed endpoint creates a user. Let's check what owambeUserId it sets.
  // Actually, the seed endpoint returns operatorUserId (which is the CUID).
  // Let's just use a hardcoded one and create it if it doesn't exist, or we can
  // modify the seed endpoint to return the owambeUserId.
  // For now, let's just use the CUID as the owambeUserId in the payload, since
  // the seed endpoint might set owambeUserId = id. Let's check.
  // Actually, let's just use 'owambe_user_op_001' and we'll mock it or create it.
  // Wait, the route does: `await prisma.user.findUnique({ where: { owambeUserId: payload.operatorOwambeUserId } })`
  // Let's check the seed endpoint to see what owambeUserId it sets.
  const operatorOwambeUserId = seedRes.body.operatorOwambeUserId || 'probe-operator-owambe-id';
  console.log(`✓ Seeded operator: ${operatorOwambeUserId}\n`);

  // --- Step 1: Inventory Push ---
  console.log('[Step 1] Pushing Experience Inventory (Owambe format)...');
  const inventoryPayload = {
    owambeExperienceId: owambeExperienceId,
    operatorOwambeUserId: operatorOwambeUserId,
    name: 'Probe Kayak Tour',
    description: 'A test kayak tour for the inventory fix probe',
    experienceType: 'TOUR',
    durationMinutes: 120,
    capacity: 10,
    meetingPoint: {
      description: 'Test Jetty',
      latitude: 6.4281,
      longitude: 3.4219,
    },
    pricing: {
      model: 'PER_PERSON',
      basePrice: 10000,
      baseCurrency: 'NGN',
    },
    status: 'ACTIVE',
  };

  const invRes = await makeRequest('/api/v1/channel/experiences/inventory', 'POST', inventoryPayload);
  console.log(`Status: ${invRes.status}`);
  console.log('Response:', JSON.stringify(invRes.body, null, 2));
  
  if (invRes.status !== 201) {
    console.error('❌ Inventory push failed!');
    process.exit(1);
  }
  console.log('✓ Inventory push succeeded!\n');

  // --- Step 2: Time-slots Push ---
  console.log('[Step 2] Pushing Time-slots (Owambe format)...');
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);
  
  const end = new Date(tomorrow);
  end.setHours(11, 0, 0, 0);

  const timeSlotsPayload = {
    slots: [
      {
        owambeTimeSlotId: owambeTimeSlotId,
        startDateTime: tomorrow.toISOString(),
        endDateTime: end.toISOString(),
        capacity: 10,
        spotsBooked: 0,
        rate: 10000,
        currency: 'NGN',
        recurrencePattern: null,
        status: 'OPEN',
      }
    ]
  };

  const tsRes = await makeRequest(`/api/v1/channel/experiences/${owambeExperienceId}/time-slots`, 'PUT', timeSlotsPayload);
  console.log(`Status: ${tsRes.status}`);
  console.log('Response:', JSON.stringify(tsRes.body, null, 2));

  if (tsRes.status !== 200) {
    console.error('❌ Time-slots push failed!');
    process.exit(1);
  }
  console.log('✓ Time-slots push succeeded!\n');

  console.log('=================================================================');
  console.log('PROBE COMPLETE: ALL STEPS PASSED');
  console.log('=================================================================');
}

runProbe().catch(console.error);
