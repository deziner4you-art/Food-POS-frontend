const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, phone: true, role: true, store_id: true }
  });
  console.log('Users in DB:', JSON.stringify(users, null, 2));

  const onlineOrders = await prisma.onlineOrder.findMany({
    take: 5,
    orderBy: { id: 'desc' },
    select: { id: true, orderId: true, status: true, claimedByRiderId: true, claimedByRiderName: true, store_id: true }
  });
  console.log('Recent OnlineOrders:', JSON.stringify(onlineOrders, null, 2));

  const posOrders = await prisma.order.findMany({
    take: 5,
    orderBy: { id: 'desc' },
    select: { id: true, order_source: true, status: true, rider_id: true, store_id: true }
  });
  console.log('Recent POS Orders:', JSON.stringify(posOrders, null, 2));

  const kots = await prisma.kOT.findMany({
    take: 5,
    orderBy: { id: 'desc' },
    select: { id: true, order_id: true, status: true, store_id: true }
  });
  console.log('Recent KOTs:', JSON.stringify(kots, null, 2));

  await prisma.$disconnect();
}

run().catch(console.error);
