const http = require('http');

http.get('http://localhost:5000/api/v1/warehouse-portal/find-stock', (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    try {
      const data = JSON.parse(body);
      console.log('API Status:', res.statusCode);
      console.log('Success:', data.success);
      if (data.data && data.data.stock) {
        console.log(`Received ${data.data.stock.length} stock items:`);
        data.data.stock.forEach((item, idx) => {
          console.log(`Item [${idx + 1}]: ${item.title} (${item.rego || item.itemNo}) -> Image: ${item.image}`);
        });
      }
    } catch (e) {
      console.error('Parse error:', e.message);
    }
  });
}).on('error', err => {
  console.error('Request failed:', err.message);
});
