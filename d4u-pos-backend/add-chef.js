const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const chef = await prisma.user.upsert({
    where: { phone: '03000000008' },
    update: {},
    create: {
      brand_id: 1,
      store_id: 1,
      role_id: 9,
      name: 'Main Chef',
      phone: '03000000008',
      hashedPin: '1234'
    }
  });
  console.log("Chef user created:", chef);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
