/**
 * D4U Online Order Bridge
 * Run: node order-bridge.cjs
 * Port: 3001
 * No npm install needed — uses Node.js built-in http only
 */
const http = require('http');

let orders = [];
let nextId = 1001;

// Store rider locations by delivery ID
let riderLocations = {};

const server = http.createServer((req, res) => {
  // CORS headers — allow all origins (website :5200, POS :5174)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  // Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // GET /online-orders — POS polls (no phone) OR website polls by phone
  if (req.method === 'GET' && req.url && req.url.startsWith('/online-orders') && !req.url.match(/^\/online-orders\/\d+$/)) {
    const urlObj = new URL(req.url, 'http://localhost:3001');
    const phone = urlObj.searchParams.get('phone');
    if (phone) {
      // Customer's own orders — all statuses
      const customerOrders = orders.filter(o => o.customerPhone === phone);
      res.writeHead(200);
      res.end(JSON.stringify(customerOrders));
    } else {
      // POS polling — only PENDING orders
      const pending = orders.filter(o => o.status === 'PENDING');
      res.writeHead(200);
      res.end(JSON.stringify(pending));
    }
    return;
  }

  // POST /online-orders — website sends order here
  if (req.method === 'POST' && req.url === '/online-orders') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body || '{}');
        const order = {
          id: nextId++,
          orderId: nextId,
          status: 'PENDING',
          kdsStatus: 'PENDING',
          type: 'Online',
          source: data.source || 'Website',
          customer: data.customer || 'Online Guest',
          customerPhone: data.customerPhone || '',
          customerAddress: data.customerAddress || 'No Address Provided',
          items: data.items || '',
          totalAmount: data.totalAmount || '0.00',
          notes: data.notes || '',
          prepTimeMinutes: 0,
          estimatedReadyAt: '',
          timePlaced: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        };
        orders.push(order);
        console.log(`[NEW ORDER] #${order.id} — ${order.items}`);
        res.writeHead(201);
        res.end(JSON.stringify({ success: true, order }));
      } catch {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  // GET /online-orders/:id — Website polls for tracking status
  if (req.method === 'GET' && req.url.match(/^\/online-orders\/\d+$/)) {
    const id = parseInt(req.url.split('/')[2]);
    const order = orders.find(o => o.id === id);
    if (order) { res.writeHead(200); res.end(JSON.stringify(order)); }
    else { res.writeHead(404); res.end(JSON.stringify({ error: 'Not found' })); }
    return;
  }

  // PATCH /online-orders/:id — KDS syncs status updates (ACCEPTED, PREPARING, READY)
  if (req.method === 'PATCH' && req.url.match(/^\/online-orders\/\d+$/)) {
    const id = parseInt(req.url.split('/')[2]);
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body || '{}');
        const idx = orders.findIndex(o => o.id === id);
        if (idx > -1) {
          orders[idx] = { ...orders[idx], ...data };
          console.log(`[STATUS UPDATE] Order #${id} → kdsStatus: ${orders[idx].kdsStatus}`);
        }
        res.writeHead(200);
        res.end(JSON.stringify({ success: true }));
      } catch {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  // DELETE /online-orders/:id — POS accepts order
  if (req.method === 'DELETE' && req.url.startsWith('/online-orders/')) {
    const id = parseInt(req.url.split('/')[2]);
    const idx = orders.findIndex(o => o.id === id);
    if (idx > -1) {
      orders[idx] = { ...orders[idx], status: 'ACCEPTED', kdsStatus: 'ACCEPTED' };
      console.log(`[ACCEPTED] Order #${id}`);
    }
    res.writeHead(200);
    res.end(JSON.stringify({ success: true }));
    return;
  }

  // POST /rider-location/:id — Rider app sends live GPS
  if (req.method === 'POST' && req.url.match(/^\/rider-location\/\d+$/)) {
    const id = parseInt(req.url.split('/')[2]);
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body || '{}');
        riderLocations[id] = {
          lat: data.lat,
          lng: data.lng,
          updatedAt: new Date().toISOString()
        };
        console.log(`[GPS UPDATE] Delivery #${id} -> lat: ${data.lat}, lng: ${data.lng}`);
        res.writeHead(200);
        res.end(JSON.stringify({ success: true }));
      } catch {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  // POST /dispatch-order — POS sends order to Rider
  if (req.method === 'POST' && req.url === '/dispatch-order') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body || '{}');
        const bridgeId = parseInt(data.bridgeOrderId);
        const idx = orders.findIndex(o => o.id === bridgeId);
        if (idx > -1) {
          orders[idx].status = 'DISPATCHED';
          orders[idx].kdsStatus = 'DISPATCHED';
          orders[idx].riderAssigned = true;
          console.log(`[DISPATCHED] Order #${bridgeId} sent to Rider`);
          res.writeHead(200);
          res.end(JSON.stringify({ success: true, order: orders[idx] }));
        } else {
          res.writeHead(404);
          res.end(JSON.stringify({ error: 'Order not found in bridge' }));
        }
      } catch (e) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  // GET /rider-orders — Rider app fetches assigned orders
  if (req.method === 'GET' && req.url === '/rider-orders') {
    // For simplicity, returning all DISPATCHED, ACCEPTED, PICKED_UP orders
    const activeRiderOrders = orders.filter(o => 
      ['DISPATCHED', 'RIDER_ACCEPTED', 'PICKED_UP'].includes(o.status)
    );
    res.writeHead(200);
    res.end(JSON.stringify(activeRiderOrders));
    return;
  }

  // GET /rider-location/:id — POS polls live GPS
  if (req.method === 'GET' && req.url.match(/^\/rider-location\/\d+$/)) {
    const id = parseInt(req.url.split('/')[2]);
    const loc = riderLocations[id];
    if (loc) {
      res.writeHead(200);
      res.end(JSON.stringify(loc));
    } else {
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Location not found' }));
    }
    return;
  }

  // POST /settle-order/:id — POS settles cash for a COD order
  if (req.method === 'POST' && req.url.match(/^\/settle-order\/\d+$/)) {
    const id = parseInt(req.url.split('/')[2]);
    const idx = orders.findIndex(o => o.id === id);
    if (idx > -1) {
      orders[idx].status = 'SETTLED';
      orders[idx].kdsStatus = 'SETTLED';
      console.log(`[SETTLED] Order #${id} cash collected by POS`);
      res.writeHead(200);
      res.end(JSON.stringify({ success: true, order: orders[idx] }));
    } else {
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Order not found' }));
    }
    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(3001, () => {
  console.log('');
  console.log('  D4U Order Bridge running on http://localhost:3001');
  console.log('  Website  → POST  http://localhost:3001/online-orders');
  console.log('  POS      → GET   http://localhost:3001/online-orders');
  console.log('  POS      → POST  http://localhost:3001/dispatch-order');
  console.log('  Rider    → GET   http://localhost:3001/rider-orders');
  console.log('');
});
