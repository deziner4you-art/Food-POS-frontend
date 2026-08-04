const { JwtService } = require('@nestjs/jwt');
const jwtService = new JwtService({ secret: process.env.JWT_SECRET || 'supersecret_d4u_key_2026' });

async function run() {
  // Generate token for Rider Anees (id: 90, store_id: 67)
  const token = jwtService.sign({ sub: 90, store_id: 67, role: 'Rider' });
  console.log('Testing claim for OnlineOrder #1124 as Rider #90...');

  const res = await fetch('http://127.0.0.1:3001/rider-orders/1124/claim', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ riderId: 90, riderName: 'Anees' })
  });

  console.log('HTTP Status:', res.status);
  const text = await res.text();
  console.log('Response:', text);
}

run().catch(console.error);
