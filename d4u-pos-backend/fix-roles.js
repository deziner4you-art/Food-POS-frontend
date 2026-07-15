const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log('Fixing roles...');

  // Update users to use roles 1, 2, 3 instead of duplicates
  await prisma.user.updateMany({ where: { role_id: 4 }, data: { role_id: 1 } });
  await prisma.user.updateMany({ where: { role_id: 7 }, data: { role_id: 1 } });
  
  await prisma.user.updateMany({ where: { role_id: 5 }, data: { role_id: 2 } });
  await prisma.user.updateMany({ where: { role_id: 8 }, data: { role_id: 2 } });
  
  await prisma.user.updateMany({ where: { role_id: 6 }, data: { role_id: 3 } });
  await prisma.user.updateMany({ where: { role_id: 9 }, data: { role_id: 3 } });

  // Delete duplicates
  await prisma.role.deleteMany({ where: { id: { in: [4, 5, 6, 7, 8, 9] } } });

  // Rename role 3 to 'Super Admin'
  await prisma.role.update({
    where: { id: 3 },
    data: { name: 'Super Admin' }
  });

  // Create Business Admin role if it doesn't exist
  const createRole = async (id, name, permissions) => {
    const existing = await prisma.role.findFirst({ where: { id } });
    if (!existing) {
      await prisma.role.create({ data: { id, name, permissions } });
    } else {
      await prisma.role.update({ where: { id }, data: { name, permissions } });
    }
  };

  await createRole(4, 'Business Admin', { all: true });
  await createRole(5, 'Business Owner', { all: true });
  await createRole(6, 'Branch Owner', { all: true });
  await createRole(7, 'Branch Manager', {});
  await createRole(8, 'Account Manager', {});
  await createRole(9, 'Chef', {});
  await createRole(10, 'Waiter', {});

  console.log('Roles fixed successfully.');
}

run().catch(console.error).finally(() => prisma.$disconnect());
