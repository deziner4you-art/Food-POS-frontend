const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  await prisma.onlineOrder.deleteMany();
  console.log("All online orders deleted.");
}
run().catch(console.error).finally(()=>prisma.$disconnect());
