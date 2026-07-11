const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const items = await prisma.inventoryItem.findMany();
  console.log(`InventoryItems count: ${items.length}`);
  if (items.length > 0) {
    console.log(items.slice(0, 5));
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
