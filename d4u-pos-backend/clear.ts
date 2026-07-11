import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.onlineOrder.deleteMany({
    where: { status: 'PENDING' }
  });
  console.log('Pending orders deleted');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
