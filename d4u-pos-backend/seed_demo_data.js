const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
  console.log('Seeding demo data...');
  
  await prisma.kOT.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.recipeIngredient.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});

  const cat1 = await prisma.category.create({ data: { store_id: 1, name: 'Burgers & Sandwiches' } });
  const cat2 = await prisma.category.create({ data: { store_id: 1, name: 'Pizzas' } });
  const cat3 = await prisma.category.create({ data: { store_id: 1, name: 'Beverages' } });

  await prisma.product.create({
    data: { store_id: 1, name: 'Zinger Deluxe Burger', sku: 'Z-01', price: 450, cost: 200, margin_pct: 55, categories: { connect: [{ id: cat1.id }] }, status: 'APPROVED', image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=80' }
  });
  
  await prisma.product.create({
    data: { store_id: 1, name: 'Chicken Fajita Pizza (Large)', sku: 'P-01', price: 1200, cost: 600, margin_pct: 50, categories: { connect: [{ id: cat2.id }] }, status: 'APPROVED', image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&q=80' }
  });

  await prisma.product.create({
    data: { store_id: 1, name: 'Mint Margarita', sku: 'D-01', price: 220, cost: 80, margin_pct: 63, categories: { connect: [{ id: cat3.id }] }, status: 'APPROVED', image_url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&q=80' }
  });

  console.log('Demo data seeded successfully!');
}

seed().finally(() => prisma.$disconnect());
