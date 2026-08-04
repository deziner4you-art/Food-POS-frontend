const { JwtService } = require('@nestjs/jwt');
const jwtService = new JwtService({ secret: process.env.JWT_SECRET || 'supersecret_d4u_key_2026' });

async function run() {
  const token = jwtService.sign({ sub: 90, store_id: 67, role: 'Rider' });

  console.log('Testing GET /rider-orders?store_id=67 with valid token...');
  const res1 = await fetch('http://127.0.0.1:3001/rider-orders?store_id=67', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log('Res 1 Status:', res1.status, await res1.text());

  console.log('\nTesting GET /rider-orders?store_id=67 without token...');
  const res2 = await fetch('http://127.0.0.1:3001/rider-orders?store_id=67');
  console.log('Res 2 Status:', res2.status, await res2.text());

  console.log('\nTesting GET /rider-orders?store_id=67 with token "null"...');
  const res3 = await fetch('http://127.0.0.1:3001/rider-orders?store_id=67', {
    headers: { 'Authorization': 'Bearer null' }
  });
  console.log('Res 3 Status:', res3.status, await res3.text());
}

run().catch(console.error);
