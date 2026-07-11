const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
  await prisma.businessDay.updateMany({
    where: { status: 'OPEN' },
    data: { dayClose: new Date(), status: 'CLOSED' }
  });
  console.log('Open business days closed!');
}
fix().finally(() => prisma.$disconnect());
