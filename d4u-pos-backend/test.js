
const jwt = require('jsonwebtoken');

async function run() {
  const token = jwt.sign({ sub: 1, phone: 'deziner4you', role: 'Super Admin' }, 'supersecret_d4u_key_2026', { expiresIn: '1d' });
  
  console.log("Generated Token:", token);
  
  const res = await fetch('http://localhost:3001/subscription/pricing', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify({
      module_key: 'BASE_POS',
      module_name: 'Base POS System',
      currency: 'USD',
      price_monthly: 50
    })
  });
  
  const data = await res.json();
  console.log("Response:", data);
}
run();
