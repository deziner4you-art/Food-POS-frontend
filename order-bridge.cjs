/**
 * D4U Online Order Bridge
 * Run: node order-bridge.cjs
 * Port: 3001
 * Uses Express and Socket.io for Real-time sync
 */
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PATCH", "DELETE"]
  }
});

const DB_FILE = path.join(__dirname, 'live_orders.json');

let orders = [];
let nextId = 1001;
let riderLocations = {};

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

// Socket connection
io.on('connection', (socket) => {
  console.log(`[SOCKET] Client connected: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`[SOCKET] Client disconnected: ${socket.id}`);
  });
});

// GET /online-orders
app.get('/online-orders', (req, res) => {
  const phone = req.query.phone;
  if (phone) {
    const customerOrders = orders.filter(o => o.customerPhone === phone);
    return res.json(customerOrders);
  } else {
    const pending = orders.filter(o => o.status === 'PENDING');
    return res.json(pending);
  }
});

// POST /online-orders
app.post('/online-orders', (req, res) => {
  try {
    const data = req.body;
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
    
    // Emit event
    io.emit('new_order', order);
    
    res.status(201).json({ success: true, order });
  } catch (err) {
    res.status(400).json({ error: 'Failed to process order' });
  }
});

// GET /online-orders/:id
app.get('/online-orders/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const order = orders.find(o => o.id === id);
  if (order) return res.json(order);
  res.status(404).json({ error: 'Not found' });
});

// PATCH /online-orders/:id
app.patch('/online-orders/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const data = req.body;
  const idx = orders.findIndex(o => o.id === id);
  if (idx > -1) {
    orders[idx] = { ...orders[idx], ...data };
    saveOrders();
    console.log(`[STATUS UPDATE] Order #${id} → kdsStatus: ${orders[idx].kdsStatus}`);
    
    // Emit event
    io.emit('order_updated', orders[idx]);
    
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

// POST /online-orders/:id/feedback
app.post('/online-orders/:id/feedback', (req, res) => {
  const id = parseInt(req.params.id);
  const data = req.body;
  const idx = orders.findIndex(o => o.id === id);
  if (idx > -1) {
    orders[idx].feedback = {
      rating: data.rating || 5,
      comment: data.comment || '',
      timestamp: new Date().toISOString()
    };
    saveOrders();
    console.log(`[FEEDBACK] Order #${id} — Rating: ${data.rating}`);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Order not found' });
  }
});

// DELETE /online-orders/:id
app.delete('/online-orders/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const idx = orders.findIndex(o => o.id === id);
  if (idx > -1) {
    orders[idx] = { ...orders[idx], status: 'ACCEPTED', kdsStatus: 'ACCEPTED' };
    saveOrders();
    console.log(`[ACCEPTED] Order #${id}`);
    
    // Emit event
    io.emit('order_updated', orders[idx]);
  }
  res.json({ success: true });
});

// POST /rider/gps
app.post('/rider/gps', (req, res) => {
  const data = req.body;
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
    
    // Emit GPS event to POS/Website
    io.emit('gps_update', { orderId: id, lat: data.lat, lng: data.lng });
    
    res.json({ success: true });
  } else {
    riderLocations[id] = { lat: data.lat, lng: data.lng, lastUpdated: new Date().toISOString() };
    console.log(`[GPS UPDATE - FALLBACK] Delivery #${id} -> lat: ${data.lat}, lng: ${data.lng}`);
    
    io.emit('gps_update', { orderId: id, lat: data.lat, lng: data.lng });
    
    res.json({ success: true });
  }
});

// POST /dispatch-order
app.post('/dispatch-order', (req, res) => {
  const data = req.body;
  const bridgeId = parseInt(data.bridgeOrderId);
  let idx = orders.findIndex(o => o.id === bridgeId);

  if (idx === -1 && data.order) {
     const newOrder = {
       id: nextId++,
       orderId: data.order.id, 
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
    
    io.emit('order_updated', orders[idx]);
    
    res.json({ success: true, order: orders[idx] });
  } else {
    res.status(404).json({ error: 'Order not found in bridge' });
  }
});

// GET /rider-orders
app.get('/rider-orders', (req, res) => {
  const activeRiderOrders = orders.filter(o => 
    ['DISPATCHED', 'RIDER_ACCEPTED', 'PICKED_UP', 'PAID'].includes(o.status)
  );
  res.json(activeRiderOrders);
});

// GET /rider/gps/:orderId
app.get('/rider/gps/:orderId', (req, res) => {
  const id = parseInt(req.params.orderId);
  const order = orders.find(o => o.id === id);
  if (order && order.delivery) {
    res.json(order.delivery);
  } else if (riderLocations[id]) {
    res.json(riderLocations[id]);
  } else {
    res.status(404).json({ error: 'Location not found' });
  }
});

// POST /settle-order/:id
app.post('/settle-order/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const idx = orders.findIndex(o => o.id === id);
  if (idx > -1) {
    orders[idx].status = 'SETTLED';
    orders[idx].kdsStatus = 'SETTLED';
    saveOrders();
    console.log(`[SETTLED] Order #${id} cash collected by POS`);
    
    io.emit('order_updated', orders[idx]);
    
    res.json({ success: true, order: orders[idx] });
  } else {
    res.status(404).json({ error: 'Order not found' });
  }
});

server.listen(3001, () => {
  console.log('');
  console.log('  D4U Order Bridge (Express + Socket.io) running on http://localhost:3001');
  console.log('  Website  → POST  http://localhost:3001/online-orders');
  console.log('  POS      → GET   http://localhost:3001/online-orders');
  console.log('  POS      → POST  http://localhost:3001/dispatch-order');
  console.log('  Rider    → GET   http://localhost:3001/rider-orders');
  console.log('');
});
