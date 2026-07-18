import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  const jsonPath = path.join(__dirname, '../../..', 'live_orders.json');
  if (!fs.existsSync(jsonPath)) {
    console.error(`[MIGRATION] File not found: ${jsonPath}`);
    process.exit(1);
  }

  console.log(`[MIGRATION] Reading data from ${jsonPath}...`);
  const rawData = fs.readFileSync(jsonPath, 'utf8');
  let orders: any[] = [];
  try {
    orders = JSON.parse(rawData);
  } catch (err) {
    console.error('[MIGRATION] Invalid JSON in live_orders.json');
    process.exit(1);
  }

  console.log(`[MIGRATION] Found ${orders.length} orders. Starting migration...`);

  for (const order of orders) {
    // Check if order already exists
    const existing = await prisma.onlineOrder.findFirst({
      where: { orderId: order.orderId },
    });

    if (existing) {
      console.log(`[MIGRATION] Order ID ${order.orderId} already exists. Skipping.`);
      continue;
    }

    try {
      await prisma.onlineOrder.create({
        data: {
          orderId: order.orderId,
          status: order.status || 'PENDING',
          kdsStatus: order.kdsStatus || 'PENDING',
          type: order.type || 'Online',
          source: order.source || 'Website',
          customer: order.customer || 'Guest',
          customerPhone: order.customerPhone || '',
          customerAddress: order.customerAddress || '',
          items: order.items || '',
          totalAmount: order.totalAmount?.toString() || '0',
          notes: order.notes || '',
          prepTimeMinutes: order.prepTimeMinutes || 0,
          estimatedReadyAt: order.estimatedReadyAt || '',
          timePlaced: order.timePlaced || new Date().toISOString(),
          riderAssigned: order.riderAssigned || false,
          feedback: order.feedback || null,
          delivery: order.delivery || null,
        },
      });
      console.log(`[MIGRATION] Successfully migrated order ${order.orderId}`);
    } catch (err) {
      console.error(`[MIGRATION] Failed to migrate order ${order.orderId}:`, err);
    }
  }

  console.log('[MIGRATION] Migration completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
