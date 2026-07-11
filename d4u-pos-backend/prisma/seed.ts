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
  const cashierRole = await prisma.role.create({ data: { name: 'Cashier', permissions: {} } });
  const managerRole = await prisma.role.create({ data: { name: 'Manager', permissions: {} } });
  const adminRole = await prisma.role.create({ data: { name: 'Admin', permissions: { all: true } } });

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
        role_id: adminRole.id,
        name: 'Super Admin',
        phone: '03000000003',
        hashedPin: 'admin',
      },
    ]
  });

  // 5. Create some test products
  const category = await prisma.category.create({
    data: { store_id: store.id, name: 'Burgers' }
  });

  await prisma.product.create({
    data: { store_id: store.id, category_id: category.id, name: 'Zinger Burger', price: 450, cost: 250, margin_pct: 44, is_active: true }
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
