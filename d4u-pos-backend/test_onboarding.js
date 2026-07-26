const http = require('http');

const data = JSON.stringify({
  is_existing_brand: false,
  brand_name: "TestBrand",
  store_location: "HQ",
  currency: "USD",
  vat_percentage: 5,
  is_chain_store: false,
  menu_strategy: "UNIFIED",
  owner_name: "Imran Farooq",
  owner_phone: "03134403460",
  owner_email: "test@example.com",
  address: "Test Address",
  package_id: 1,
  admin_user: {
    name: "Imran Farooq",
    phone: "03134403460",
    password: "password123"
  }
});

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/subscription/onboarding',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => console.log('Response:', res.statusCode, body));
});

req.on('error', e => console.error(e));
req.write(data);
req.end();
