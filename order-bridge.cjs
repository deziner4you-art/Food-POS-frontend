/**
 * D4U Online Order Bridge
 * Run: node order-bridge.cjs
 * Port: 3001
 * No npm install needed — uses Node.js built-in http only
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'live_orders.json');

let orders = [];
let nextId = 1001;

// Load orders on startup
if (fs.existsSync(DB_FILE)) {
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    orders = JSON.parse(data);
    if (orders.length > 0) {
      nextId = Math.max(...orders.map(o => o.id)) + 1;
    }
    console.log(`[BRIDGE] Loaded ${orders.length} orders from live_orders.json`);
  } catch (err) {
    console.error('[BRIDGE] Error loading live_orders.json:', err);
  }
}

function saveOrders() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(orders, null, 2), 'utf8');
  } catch (err) {
    console.error('[BRIDGE] Error saving live_orders.json:', err);
  }
}

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
        const currentId = nextId++;
        const order = {
          id: currentId,
          orderId: currentId,
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
          feedback: null,
          timePlaced: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        };
        orders.push(order);
        saveOrders();
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
          saveOrders();
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

  // POST /online-orders/:id/feedback — Customer sends rating & comments
  if (req.method === 'POST' && req.url.match(/^\/online-orders\/\d+\/feedback$/)) {
    const id = parseInt(req.url.split('/')[2]);
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body || '{}');
        const idx = orders.findIndex(o => o.id === id);
        if (idx > -1) {
          orders[idx].feedback = {
            rating: data.rating || 5,
            comment: data.comment || '',
            timestamp: new Date().toISOString()
          };
          saveOrders();
          console.log(`[FEEDBACK] Order #${id} — Rating: ${data.rating}`);
          res.writeHead(200);
          res.end(JSON.stringify({ success: true }));
        } else {
          res.writeHead(404);
          res.end(JSON.stringify({ error: 'Order not found' }));
        }
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
      saveOrders();
      console.log(`[ACCEPTED] Order #${id}`);
    }
    res.writeHead(200);
    res.end(JSON.stringify({ success: true }));
    return;
  }

  // POST /rider/gps — Rider app sends live GPS (Phase 2)
  if (req.method === 'POST' && req.url === '/rider/gps') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body || '{}');
        const id = parseInt(data.orderId);
        const idx = orders.findIndex(o => o.id === id);
        
        if (idx > -1) {
          orders[idx].delivery = {
            riderId: data.riderId || 'R1',
            lat: data.lat,
            lng: data.lng,
            lastUpdated: new Date().toISOString()
          };
          saveOrders();
          console.log(`[GPS UPDATE] Order #${id} -> lat: ${data.lat}, lng: ${data.lng}`);
          res.writeHead(200);
          res.end(JSON.stringify({ success: true }));
        } else {
          // Fallback if order not found but we want to store it anyway
          riderLocations[id] = { lat: data.lat, lng: data.lng, lastUpdated: new Date().toISOString() };
          console.log(`[GPS UPDATE - FALLBACK] Delivery #${id} -> lat: ${data.lat}, lng: ${data.lng}`);
          res.writeHead(200);
          res.end(JSON.stringify({ success: true }));
        }
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
        let idx = orders.findIndex(o => o.id === bridgeId);

        // If it's a manual POS delivery, it won't exist in the bridge yet. Create it!
        if (idx === -1 && data.order) {
           const newOrder = {
             id: nextId++,
             orderId: data.order.id, // POS internal ID
             status: 'DISPATCHED',
             kdsStatus: 'DISPATCHED',
             type: 'Delivery',
             source: 'POS',
             customer: data.order.customer || 'Guest',
             customerAddress: data.order.address || 'Address',
             items: data.order.items ? data.order.items.map(i => `${i.qty}x ${i.name}`).join(', ') : '',
             totalAmount: data.order.cod || 0,
             riderAssigned: true,
             timePlaced: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
           };
           orders.push(newOrder);
           idx = orders.length - 1;
        }

        if (idx > -1) {
          orders[idx].status = 'DISPATCHED';
          orders[idx].kdsStatus = 'DISPATCHED';
          orders[idx].riderAssigned = true;
          saveOrders();
          console.log(`[DISPATCHED] Order #${orders[idx].id} sent to Rider`);
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
    // For simplicity, returning all DISPATCHED, ACCEPTED, PICKED_UP, PAID orders
    const activeRiderOrders = orders.filter(o => 
      ['DISPATCHED', 'RIDER_ACCEPTED', 'PICKED_UP', 'PAID'].includes(o.status)
    );
    res.writeHead(200);
    res.end(JSON.stringify(activeRiderOrders));
    return;
  }

  // GET /rider/gps/:orderId — POS polls live GPS (Phase 2)
  if (req.method === 'GET' && req.url.match(/^\/rider\/gps\/\d+$/)) {
    const id = parseInt(req.url.split('/')[3]);
    const order = orders.find(o => o.id === id);
    if (order && order.delivery) {
      res.writeHead(200);
      res.end(JSON.stringify(order.delivery));
    } else if (riderLocations[id]) {
      res.writeHead(200);
      res.end(JSON.stringify(riderLocations[id]));
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
      saveOrders();
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
