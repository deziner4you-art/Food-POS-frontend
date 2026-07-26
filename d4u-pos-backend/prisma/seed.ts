import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { seedRbac } from './seed-rbac';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Database with Core Data...');

  // 0. Seed Enterprise RBAC Foundation (Idempotent)
  await seedRbac(prisma);

  // 1. Create Default Brand
  const brand = await prisma.brand.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, name: 'D4U Enterprise' },
  });

  // 2. Create Global Store (Head Office HQ)
  const store = await prisma.store.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      brand_id: brand.id,
      name: 'Head Office HQ',
      location: 'Central Cloud Node',
      is_online: true,
    },
  });

  // 3. Find Roles by Name
  const cashierRole = await prisma.role.findFirst({ where: { name: 'Cashier' } });
  const managerRole = await prisma.role.findFirst({ where: { name: 'Branch Manager' } }) || await prisma.role.findFirst({ where: { name: 'Manager' } });
  const superAdminRole = await prisma.role.findFirst({ where: { name: 'Super Admin' } });
  const riderRole = await prisma.role.findFirst({ where: { name: 'Rider' } });

  // 4. Create/Upsert Demo Users
  const users = [
    {
      phone: '03000000001',
      name: 'Ali Cashier',
      role_id: cashierRole?.id || 1,
      pin: '1234',
    },
    {
      phone: '03000000002',
      name: 'Sara Manager',
      role_id: managerRole?.id || 2,
      pin: 'manager123',
    },
    {
      phone: 'deziner4you',
      name: 'Super Admin',
      role_id: superAdminRole?.id || 3,
      pin: '!765Bjs!',
    },
    {
      phone: '03000000007',
      name: 'Ali Rider',
      role_id: riderRole?.id || 11,
      pin: '1234',
    },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { phone: u.phone },
      update: {
        name: u.name,
        role_id: u.role_id,
        brand_id: brand.id,
        store_id: store.id,
      },
      create: {
        brand_id: brand.id,
        store_id: store.id,
        role_id: u.role_id,
        name: u.name,
        phone: u.phone,
        hashedPin: await bcrypt.hash(u.pin, 10),
      },
    });
  }

  // 5. Create test products idempotently
  const category = await prisma.category.findFirst({ where: { store_id: store.id, name: 'Burgers' } }) 
    || await prisma.category.create({ data: { store_id: store.id, name: 'Burgers' } });

  const existingProduct = await prisma.product.findFirst({ where: { store_id: store.id, name: 'Zinger Burger' } });
  if (!existingProduct) {
    await prisma.product.create({
      data: { store_id: store.id, categories: { connect: [{ id: category.id }] }, name: 'Zinger Burger', price: 450, cost: 250, margin_pct: 44, is_active: true }
    });
  }

  console.log('✅ Seeding Complete! Core DB & RBAC Foundation synced.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
