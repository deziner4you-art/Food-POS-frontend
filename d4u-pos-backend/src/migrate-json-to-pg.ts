import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();
const jsonPath = path.join(__dirname, '..', '..', 'live_orders.json');

async function main() {
  console.log('Starting JSON to PostgreSQL migration...');
  if (!fs.existsSync(jsonPath)) {
    console.log(`JSON file not found at ${jsonPath}. Skipping migration.`);
    return;
  }

  const rawData = fs.readFileSync(jsonPath, 'utf8');
  const orders = JSON.parse(rawData);
  console.log(`Found ${orders.length} orders in JSON.`);

  let insertedCount = 0;
  for (const order of orders) {
    try {
      await prisma.onlineOrder.upsert({
        where: { id: Number(order.id) },
        update: {
          orderId: order.orderId ? Number(order.orderId) : null,
          status: order.status || 'PENDING',
          kdsStatus: order.kdsStatus || 'PENDING',
          type: order.type || 'Online',
          source: order.source || 'Website',
          customer: order.customer || 'Online Guest',
          customerPhone: order.customerPhone || '',
          customerAddress: order.customerAddress || '',
          items:
            typeof order.items === 'string'
              ? order.items
              : JSON.stringify(order.items),
          totalAmount: String(order.totalAmount || '0.00'),
          notes: order.notes || '',
          prepTimeMinutes: Number(order.prepTimeMinutes || 0),
          estimatedReadyAt: order.estimatedReadyAt || '',
          timePlaced: order.timePlaced || '',
          riderAssigned: !!order.riderAssigned,
          feedback: order.feedback || undefined,
          delivery: order.delivery || undefined,
        },
        create: {
          id: Number(order.id),
          orderId: order.orderId ? Number(order.orderId) : null,
          status: order.status || 'PENDING',
          kdsStatus: order.kdsStatus || 'PENDING',
          type: order.type || 'Online',
          source: order.source || 'Website',
          customer: order.customer || 'Online Guest',
          customerPhone: order.customerPhone || '',
          customerAddress: order.customerAddress || '',
          items:
            typeof order.items === 'string'
              ? order.items
              : JSON.stringify(order.items),
          totalAmount: String(order.totalAmount || '0.00'),
          notes: order.notes || '',
          prepTimeMinutes: Number(order.prepTimeMinutes || 0),
          estimatedReadyAt: order.estimatedReadyAt || '',
          timePlaced: order.timePlaced || '',
          riderAssigned: !!order.riderAssigned,
          feedback: order.feedback || undefined,
          delivery: order.delivery || undefined,
        },
      });
      insertedCount++;
    } catch (err) {
      console.error(`Failed to migrate order #${order.id}:`, err);
    }
  }

  console.log(
    `Successfully migrated ${insertedCount}/${orders.length} orders.`,
  );

  try {
    await prisma.$executeRawUnsafe(
      `SELECT setval(pg_get_serial_sequence('"OnlineOrder"', 'id'), COALESCE((SELECT MAX(id) FROM "OnlineOrder"), 1));`,
    );
    console.log('PostgreSQL ID sequence updated successfully.');
  } catch (err) {
    console.error('Failed to update PostgreSQL ID sequence:', err);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
