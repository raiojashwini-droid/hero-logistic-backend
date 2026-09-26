const http = require('http');

console.log('--- Testing GET /api/v1/warehouse-portal/receive-inbound ---');

http.get('http://localhost:5000/api/v1/warehouse-portal/receive-inbound', (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    try {
      const data = JSON.parse(body);
      console.log('GET Status:', res.statusCode);
      console.log('Success:', data.success);
      if (data.data) {
        console.log('Inbound No:', data.data.inboundNo);
        console.log('Suppliers:', data.data.suppliers?.length);
        console.log('Drivers:', data.data.drivers?.length);
        console.log('Vehicles:', data.data.vehicles?.length);
        console.log('Warehouses:', data.data.warehouses?.length);
        console.log('Holding Areas:', data.data.holdingAreas?.length);
        console.log('Load Lanes:', data.data.loadLanes?.length);
      }

      // Test POST receive inbound receipt
      console.log('\n--- Testing POST /api/v1/warehouse-portal/inbound/receive ---');
      const postData = JSON.stringify({
        inboundNo: `INB-TEST-${Date.now()}`,
        supplier: 'Global Logistics & Auto Freight',
        referenceNote: 'Test delivery receipt',
        transportType: 'Truck',
        driverName: 'Driver VIC 11223344',
        vehicleRef: 'TRK-9901 - Volvo FH16 Heavy Rig',
        receivingDepot: 'ABC Pvt Ltd / Main Depot',
        zone: 'Zone A',
        row: 'Row 1',
        bay: 'Bay 1',
        notes: 'API Test Receive',
        items: [
          {
            vin: `VIN-${Date.now()}-01`,
            rego: 'TST-8811',
            make: 'Toyota',
            model: 'HiAce',
            type: 'Vehicle',
            condition: 'Good',
            location: 'Zone A / Row 1 / Bay 1'
          }
        ]
      });

      const req = http.request({
        hostname: 'localhost',
        port: 5000,
        path: '/api/v1/warehouse-portal/inbound/receive',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      }, (postRes) => {
        let postBody = '';
        postRes.on('data', chunk => postBody += chunk);
        postRes.on('end', () => {
          console.log('POST Status:', postRes.statusCode);
          console.log('POST Response:', postBody);
        });
      });
      req.write(postData);
      req.end();

    } catch (e) {
      console.error('Parse error:', e.message);
    }
  });
}).on('error', err => {
  console.error('GET Request failed:', err.message);
});
