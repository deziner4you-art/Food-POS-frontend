import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Database with Core Data...');

  // 1. Create Default Brand
  const brand = await prisma.brand.create({
    data: { name: 'D4U Enterprise' },
  });

  // 2. Create Global Store (Head Office HQ)
  const store = await prisma.store.create({
    data: {
      brand_id: brand.id,
      name: 'Head Office HQ',
      location: 'Central Cloud Node',
      is_online: true,
    },
  });

  // 3. Create Roles
  const cashierRole = await prisma.role.upsert({ where: { id: 1 }, update: { name: 'Cashier' }, create: { id: 1, name: 'Cashier', permissions: {} } });
  const managerRole = await prisma.role.upsert({ where: { id: 2 }, update: { name: 'Manager' }, create: { id: 2, name: 'Manager', permissions: {} } });
  const superAdminRole = await prisma.role.upsert({ where: { id: 3 }, update: { name: 'Super Admin' }, create: { id: 3, name: 'Super Admin', permissions: { all: true } } });
  const businessAdminRole = await prisma.role.upsert({ where: { id: 4 }, update: { name: 'Business Admin' }, create: { id: 4, name: 'Business Admin', permissions: { all: true } } });
  const businessOwnerRole = await prisma.role.upsert({ where: { id: 5 }, update: { name: 'Business Owner' }, create: { id: 5, name: 'Business Owner', permissions: { all: true } } });
  const branchOwnerRole = await prisma.role.upsert({ where: { id: 6 }, update: { name: 'Branch Owner' }, create: { id: 6, name: 'Branch Owner', permissions: { all: true } } });
  const branchManagerRole = await prisma.role.upsert({ where: { id: 7 }, update: { name: 'Branch Manager' }, create: { id: 7, name: 'Branch Manager', permissions: {} } });
  const accountManagerRole = await prisma.role.upsert({ where: { id: 8 }, update: { name: 'Account Manager' }, create: { id: 8, name: 'Account Manager', permissions: {} } });
  const chefRole = await prisma.role.upsert({ where: { id: 9 }, update: { name: 'Chef' }, create: { id: 9, name: 'Chef', permissions: {} } });
  const waiterRole = await prisma.role.upsert({ where: { id: 10 }, update: { name: 'Waiter' }, create: { id: 10, name: 'Waiter', permissions: {} } });
  const riderRole = await prisma.role.upsert({ where: { id: 11 }, update: { name: 'Rider' }, create: { id: 11, name: 'Rider', permissions: {} } });

  // 4. Create Users (Demo Accounts)
  await prisma.user.createMany({
    data: [
      {
        brand_id: brand.id,
        store_id: store.id,
        role_id: cashierRole.id,
        name: 'Ali Cashier',
        phone: '03000000001',
        hashedPin: '1234',
      },
      {
        brand_id: brand.id,
        store_id: store.id,
        role_id: managerRole.id,
        name: 'Sara Manager',
        phone: '03000000002',
        hashedPin: 'manager123',
      },
      {
        brand_id: brand.id,
        store_id: store.id,
        role_id: superAdminRole.id,
        name: 'Super Admin',
        phone: '03000000003',
        hashedPin: 'admin',
      },
      {
        brand_id: brand.id,
        store_id: store.id,
        role_id: riderRole.id,
        name: 'Ali Rider',
        phone: '03000000007',
        hashedPin: '1234',
      },
    ]
  });

  // 5. Create some test products
  const category = await prisma.category.create({
    data: { store_id: store.id, name: 'Burgers' }
  });

  await prisma.product.create({
    data: { store_id: store.id, categories: { connect: [{ id: category.id }] }, name: 'Zinger Burger', price: 450, cost: 250, margin_pct: 44, is_active: true }
  });

  console.log('✅ Seeding Complete! Test users and catalog created.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
