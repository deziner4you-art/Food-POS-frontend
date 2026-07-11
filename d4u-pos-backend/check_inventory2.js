const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const items = await prisma.inventoryItem.findMany({
    where: { name: { contains: 'Bun' } }
  });
  console.log(items);
}

main().catch(console.error).finally(() => prisma.$disconnect());
