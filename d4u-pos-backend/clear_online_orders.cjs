const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.onlineOrder.deleteMany({});
  console.log('Deleted online orders:', result.count);
}
main().catch(console.error).finally(() => prisma.$disconnect());
