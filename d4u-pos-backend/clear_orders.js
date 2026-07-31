const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.order.deleteMany({
    where: {
      status: {
        in: ['PENDING', 'PREPARING', 'READY']
      }
    }
  });
  console.log('Deleted pending terminal orders:', result.count);
}
main().catch(console.error).finally(() => prisma.$disconnect());
