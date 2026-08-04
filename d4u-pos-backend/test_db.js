const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const stores = await prisma.store.count();
  const users = await prisma.user.count();
  const brands = await prisma.brand.count();
  const roles = await prisma.role.count();
  const customers = await prisma.customer.count();
  // Check if setting model exists (could be settings or configuration)
  let adminSettings = 0;
  if (prisma.setting) adminSettings = await prisma.setting.count();
  else if (prisma.appSetting) adminSettings = await prisma.appSetting.count();

  const store67 = await prisma.store.findUnique({where: {id: 67}});
  const brand44 = await prisma.brand.findUnique({where: {id: 44}});
  const user90 = await prisma.user.findUnique({where: {id: 90}});

  console.log(JSON.stringify({
    stores, users, brands, roles, customers, adminSettings,
    store67: !!store67, brand44: !!brand44, user90: !!user90
  }, null, 2));
}
main().catch(e => {console.error(e); process.exit(1)}).finally(() => prisma.$disconnect());
