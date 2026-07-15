const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const orders = await prisma.onlineOrder.findMany();
  console.log(JSON.stringify(orders, null, 2));
}
run().catch(console.error).finally(()=>prisma.$disconnect());
