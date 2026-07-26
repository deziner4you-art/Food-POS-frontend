const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  try {
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "Subscription" CASCADE;');
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "SaasPackage" CASCADE;');
    console.log('Truncated');
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
})();
