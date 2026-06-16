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

  // 3. Create Super Admin Role with full Feature Toggling Permissions
  const superAdminRole = await prisma.role.create({
    data: {
      name: 'SuperAdmin',
      permissions: {
        all: true,
        canManageUsers: true,
        canEditRecipes: true,
        canToggleFeatures: true, // SaaS Feature Toggling capability
      },
    },
  });

  // 4. Create Super Admin User
  const superAdmin = await prisma.user.create({
    data: {
      brand_id: brand.id,
      store_id: store.id,
      role_id: superAdminRole.id,
      name: 'System Super Admin',
      phone: '03001234567',
      hashedPin: 'dummy_hash_1234', // This will be bcrypt in auth flow
    },
  });

  console.log('✅ Seeding Complete! Super Admin created for Head Office.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
