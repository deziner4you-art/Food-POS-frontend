const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function run() {
  const storeId = 67;
  console.log('AUDIT: store_id =', storeId);

  // OnlineOrder
  const onlineOrders = await prisma.onlineOrder.findMany({
    where: { store_id: storeId },
    select: { id: true, orderId: true, status: true, kdsStatus: true, claimedByRiderId: true, posOrderId: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
  console.log('\nMODEL: OnlineOrder');
  const onlineCount = await prisma.onlineOrder.count({ where: { store_id: storeId } });
  console.log('COUNT:', onlineCount);
  console.log('SAMPLE (up to 200):', onlineOrders.map(o => ({ id: o.id, orderId: o.orderId, status: o.status, kdsStatus: o.kdsStatus, claimedByRiderId: o.claimedByRiderId, posOrderId: o.posOrderId })));
  const onlineIds = onlineOrders.map(o => o.id);
  console.log('ONLINE_ORDER IDs:', onlineIds);
  // Status distribution computed from fetched sample
  const statusDist = onlineOrders.reduce((acc, o) => { acc[o.status] = (acc[o.status] || 0) + 1; return acc; }, {});
  console.log('STATUS DISTRIBUTION (sample):', statusDist);

  // POS Orders linked via OnlineOrder.posOrderId (and other POS orders for store)
  const posOrders = await prisma.order.findMany({
    where: { store_id: storeId },
    select: { id: true, status: true, total_amount: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
  console.log('\nMODEL: Order (POS)');
  console.log('COUNT:', await prisma.order.count({ where: { store_id: storeId } }));
  console.log('SAMPLE (up to 200):', posOrders.map(o => ({ id: o.id, status: o.status })));
  console.log('POS ORDER IDs:', posOrders.map(o => o.id));

  // KOT
  const kots = await prisma.kOT.findMany({
    where: { store_id: storeId },
    select: { id: true, order_id: true, status: true, createdAt: true, readyAt: true },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
  console.log('\nMODEL: KOT');
  console.log('COUNT:', await prisma.kOT.count({ where: { store_id: storeId } }));
  console.log('SAMPLE (up to 200):', kots.map(k => ({ id: k.id, order_id: k.order_id, status: k.status })));
  console.log('KOT IDs:', kots.map(k => k.id));

  // Rider claims present on OnlineOrder.claimedByRiderId and any Order.rider_id
  const claimedOnline = await prisma.onlineOrder.findMany({
    where: { store_id: storeId, claimedByRiderId: { not: null } },
    select: { id: true, claimedByRiderId: true, claimedByRiderName: true, status: true },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
  console.log('\nOnlineOrder claimed entries count:', claimedOnline.length);
  if (claimedOnline.length) console.log('SAMPLE claimed:', claimedOnline.map(c => ({ id: c.id, claimedByRiderId: c.claimedByRiderId, claimedByRiderName: c.claimedByRiderName, status: c.status })));

  // Orders where rider_id relation exists (Rider assignment)
  const riderAssigned = await prisma.order.findMany({ where: { store_id: storeId, rider_id: { not: null } }, select: { id: true, rider_id: true, status: true }, take: 200 });
  console.log('\nOrder.rider assignments count:', riderAssigned.length);
  if (riderAssigned.length) console.log('SAMPLE:', riderAssigned.map(r => ({ id: r.id, rider_id: r.rider_id, status: r.status })));

  // CashTransaction / CashFlow related to store
  const cashTx = await prisma.cashTransaction.findMany({ where: { store_id: storeId }, select: { id: true, amount: true, created_at: true }, take: 200 });
  console.log('\nMODEL: CashTransaction');
  console.log('COUNT:', await prisma.cashTransaction.count({ where: { store_id: storeId } }));
  console.log('SAMPLE:', cashTx.map(c => ({ id: c.id, amount: c.amount })));

  // CashFlow summary (total_amount is the stored field name)
  console.log('\nMODEL: CashFlow');
  console.log('COUNT:', await prisma.cashFlow.count({ where: { store_id: storeId } }));
  const cashFlowsSample = await prisma.cashFlow.findMany({ where: { store_id: storeId }, select: { id: true, total_amount: true }, take: 50 });
  console.log('SAMPLE:', cashFlowsSample.map(c => ({ id: c.id, total_amount: c.total_amount })));

  // Any rider history model? Search for model names dynamically is not possible here — we rely on common models 'rider_history' not present; check for table 'rider_history' via raw query
  try {
    const rh = await prisma.$queryRawUnsafe(`SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name ILIKE '%rider%';`);
    console.log('\nTables matching "%rider%":', rh);
  } catch (e) {
    console.log('\nCould not run information_schema query (insufficient perms?)', e.message);
  }

  // FK-dependent records check: count rows referencing OnlineOrder IDs
  if (onlineIds.length) {
    // Example: find orders linked via posOrderId
    const linkedPos = await prisma.order.findMany({ where: { pos_order_id: { in: onlineIds } }, select: { id: true }, take: 200 });
    console.log('\nLinked POS orders to OnlineOrder.posOrderId count sample:', linkedPos.length);
  }

  await prisma.$disconnect();
}

run().catch(e => { console.error('ERROR', e); prisma.$disconnect(); process.exit(1); });
