const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  // Create a customer
  const customer = await prisma.customer.upsert({
    where: { phone: '03001234567' },
    update: {},
    create: { name: 'Test QA', phone: '03001234567' },
  });

  // Create an OnlineOrder
  const onlineOrder = await prisma.onlineOrder.create({
    data: {
      store_id: 1, // Assume store 1 for test
      status: 'PENDING',
      type: 'Online',
      source: 'Website',
      customer: customer.name,
      customerPhone: customer.phone,
      customerAddress: 'QA Address',
      items: JSON.stringify([{ id: 1, name: 'Pizza', price: 1000, quantity: 1 }]),
      totalAmount: '1000',
      paymentMethod: 'COD',
      timePlaced: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    }
  });

  // Create linked POS Order
  const posOrder = await prisma.order.create({
    data: {
      store_id: 1,
      business_date: new Date(),
      total_amount: 1000,
      status: 'PENDING',
      order_source: 'ONLINE',
      payment_method: 'COD',
      delivery_address: 'QA Address',
      created_by: 1,
    }
  });

  // Link them
  await prisma.onlineOrder.update({
    where: { id: onlineOrder.id },
    data: { posOrderId: posOrder.id }
  });

  // Create KOT
  const kot = await prisma.kOT.create({
    data: {
      store_id: 1,
      order_id: posOrder.id,
      status: 'PENDING',
      type: 'KITCHEN',
    }
  });

  console.log(`Created test order set:
    OnlineOrder.id = ${onlineOrder.id}
    POS Order.id = ${posOrder.id}
    KOT.id = ${kot.id}
  `);

  await prisma.$disconnect();
}

run().catch(console.error);
