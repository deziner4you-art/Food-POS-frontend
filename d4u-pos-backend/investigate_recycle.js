const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deepInvestigate() {
  // Check ALL stores, regardless of status - to find the root cause
  const allStores = await prisma.store.findMany({
    include: { brand: { select: { name: true, status: true, id: true } } },
    orderBy: { id: 'asc' }
  });
  
  console.log('--- ALL STORES IN DATABASE ---');
  console.log('Total count:', allStores.length);
  allStores.forEach(s => {
    console.log(`Store ID: ${s.id} | "${s.name}" | status: ${s.status} | brand_id: ${s.brand_id} | Brand: "${s.brand?.name}" | Brand status: ${s.brand?.status}`);
  });

  // Check what Store IDs exist and how the brand_id FK works
  const allBrands = await prisma.brand.findMany({ orderBy: { id: 'asc' }, take: 10 });
  console.log('\n--- FIRST 10 BRANDS IN DATABASE ---');
  allBrands.forEach(b => {
    console.log(`Brand ID: ${b.id} | "${b.name}" | status: ${b.status}`);
  });

  // Check Subscription model to see if brands had subscriptions
  const subscriptions = await prisma.subscription.findMany({ include: { brand: { select: { name: true, status: true } } } });
  console.log('\n--- SUBSCRIPTIONS ---');
  console.log('Count:', subscriptions.length);
  subscriptions.forEach(s => {
    console.log(`Sub ID: ${s.id} | brand: "${s.brand?.name}" | brand_status: ${s.brand?.status}`);
  });

  await prisma.$disconnect();
}

deepInvestigate().catch(e => { console.error(e); prisma.$disconnect(); });
