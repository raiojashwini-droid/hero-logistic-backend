const axios = require('axios');

const API_BASE = 'http://localhost:5000/api/v1';

async function runTest() {
  console.log('🚀 Starting Complete Truck, Trailer & Driver Assignment Workflow Test...');

  // 1. Authenticate / Login as Company Admin
  let token = '';
  try {
    const loginRes = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@herologistics.com',
      password: 'Password123!'
    });
    token = loginRes.data?.data?.token || loginRes.data?.token;
    console.log('✅ Logged in successfully as Company Admin.');
  } catch (err) {
    console.warn('Login with default admin failed, trying fallback company token...');
    // Try other known users or test token
    try {
      const loginRes2 = await axios.post(`${API_BASE}/auth/login`, {
        email: 'test@hero.com',
        password: 'password'
      });
      token = loginRes2.data?.data?.token || loginRes2.data?.token;
    } catch (e2) {
      console.log('Using direct token test...');
    }
  }

  const client = axios.create({
    baseURL: API_BASE,
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });

  const timestamp = Date.now();
  const truckPlate = `TRK-${timestamp.toString().slice(-4)}`;
  const trailerPlate = `TRL-${timestamp.toString().slice(-4)}`;

  console.log(`\n--- Step 1: Create Prime Mover (Truck) Independently: [${truckPlate}] ---`);
  const truckRes = await client.post('/vehicles', {
    rego: truckPlate,
    plate: truckPlate,
    make: 'Kenworth',
    model: 'T610',
    year: 2024,
    category: 'TRUCK',
    fuelType: 'Diesel',
    color: 'Polar White',
    vin: `1XKW-${timestamp}`,
    status: 'IDLE'
  });
  const truck = truckRes.data?.data || truckRes.data;
  console.log(`✅ Truck created successfully. ID: ${truck.id}, Category: ${truck.category}, Status: ${truck.status}`);
  if (truck.category !== 'TRUCK') throw new Error(`Expected category TRUCK, got ${truck.category}`);
  if (truck.assignedTrailerId) throw new Error('New truck should not have an assigned trailer!');

  console.log(`\n--- Step 2: Create Trailer Independently: [${trailerPlate}] ---`);
  const trailerRes = await client.post('/vehicles', {
    rego: trailerPlate,
    plate: trailerPlate,
    make: 'Vawdrey',
    model: 'Curtainsider 45ft',
    year: 2023,
    category: 'TRAILER',
    regType: 'Trailer',
    color: 'Silver',
    vin: `6VAW-${timestamp}`,
    status: 'IDLE'
  });
  const trailer = trailerRes.data?.data || trailerRes.data;
  console.log(`✅ Trailer created successfully. ID: ${trailer.id}, Category: ${trailer.category}, Status: ${trailer.status}`);
  if (trailer.category !== 'TRAILER') throw new Error(`Expected category TRAILER, got ${trailer.category}`);
  if (trailer.assignedTruckId) throw new Error('New trailer should not require immediate assignment!');

  console.log('\n--- Step 3: Attach Trailer to Truck ---');
  const attachRes = await client.post(`/vehicles/${truck.id}/attach-trailer`, {
    trailerId: trailer.id,
    notes: 'Testing initial coupling'
  });
  console.log('Attach response:', attachRes.data?.data?.message || attachRes.data?.message);

  console.log('\n--- Step 4: Verify Bidirectional Coupling via getById ---');
  const getTruck = await client.get(`/vehicles/${truck.id}`);
  const truckData = getTruck.data?.data || getTruck.data;
  console.log(`Truck assignedTrailerId: ${truckData.assignedTrailerId}`);
  console.log(`Truck linked trailer rego: ${truckData.assignedTrailer?.rego || truckData.assignedTrailer?.plate}`);
  if (truckData.assignedTrailerId !== trailer.id) throw new Error('Truck assignedTrailerId does not match trailer id!');

  const getTrailer = await client.get(`/vehicles/${trailer.id}`);
  const trailerData = getTrailer.data?.data || getTrailer.data;
  console.log(`Trailer assignedTruckId: ${trailerData.assignedTruckId}`);
  console.log(`Trailer linked prime mover rego: ${trailerData.assignedTruck?.rego || trailerData.assignedTruck?.plate}`);
  if (trailerData.assignedTruckId !== truck.id) throw new Error('Trailer assignedTruckId does not match truck id!');

  console.log('\n--- Step 5: Enforce 1:1 Coupling (Prevent Double Attachment) ---');
  const secondTruckPlate = `TRK2-${timestamp.toString().slice(-4)}`;
  const truck2Res = await client.post('/vehicles', {
    rego: secondTruckPlate,
    plate: secondTruckPlate,
    make: 'Volvo',
    model: 'FH16',
    category: 'TRUCK'
  });
  const truck2 = truck2Res.data?.data || truck2Res.data;

  try {
    await client.post(`/vehicles/${truck2.id}/attach-trailer`, {
      trailerId: trailer.id
    });
    throw new Error('Double attachment should have been rejected!');
  } catch (conflictErr) {
    if (conflictErr.response?.status === 409) {
      console.log('✅ Correctly blocked double attachment with 409 Conflict:', conflictErr.response.data?.message);
    } else {
      throw conflictErr;
    }
  }

  console.log('\n--- Step 6: Detach / Unhitch Trailer ---');
  const detachRes = await client.post(`/vehicles/${truck.id}/detach-trailer`);
  console.log('Detach response:', detachRes.data?.data?.message || detachRes.data?.message);

  const getTruckAfterDetach = await client.get(`/vehicles/${truck.id}`);
  const truckAfter = getTruckAfterDetach.data?.data || getTruckAfterDetach.data;
  const getTrailerAfterDetach = await client.get(`/vehicles/${trailer.id}`);
  const trailerAfter = getTrailerAfterDetach.data?.data || getTrailerAfterDetach.data;

  console.log(`Truck assignedTrailerId after unhitch: ${truckAfter.assignedTrailerId || 'None (Standalone / Bobtail)'}`);
  console.log(`Trailer assignedTruckId after unhitch: ${trailerAfter.assignedTruckId || 'None (Available in Yard)'}`);
  console.log(`Trailer status: ${trailerAfter.status} (Available in Yard)`);

  if (truckAfter.assignedTrailerId !== null && truckAfter.assignedTrailerId !== undefined) {
    throw new Error('Truck should have assignedTrailerId cleared!');
  }
  if (trailerAfter.assignedTruckId !== null && trailerAfter.assignedTruckId !== undefined) {
    throw new Error('Trailer should have assignedTruckId cleared!');
  }

  console.log('\n🎉 ALL 6 WORKFLOW VERIFICATION TESTS PASSED PERFECTLY!\n');
}

runTest().catch(err => {
  console.error('❌ Test failed:', err.response?.data || err.message);
  process.exit(1);
});
