const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const roles = ['Admin', 'Owner', 'Manager', 'Accounts', 'Cashier', 'Cheff', 'Rider', 'Waiter', 'Kitchen Staff', 'Delivery Manager'];
  for (const r of roles) {
    try {
      await prisma.role.upsert({
        where: { name: r },
        update: {},
        create: { name: r, description: r + ' role' }
      });
    } catch (e) {
      console.log('Error inserting ' + r, e);
    }
  }
  console.log(await prisma.role.findMany());
}
main().catch(console.error).finally(() => prisma.$disconnect());
