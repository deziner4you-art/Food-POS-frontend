const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.businessDay.updateMany({
    where: { status: 'OPEN' },
    data: { status: 'CLOSED', dayClose: new Date() }
  });
  console.log('Closed all open days!');
}

main().finally(() => prisma.$disconnect());
