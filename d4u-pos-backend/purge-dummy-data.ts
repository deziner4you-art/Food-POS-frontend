import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting dummy data purge...');

  // Reverse dependency order
  const kots = await prisma.kOT.deleteMany({});
  console.log(`Deleted ${kots.count} KOTs.`);

  const orderItems = await prisma.orderItem.deleteMany({});
  console.log(`Deleted ${orderItems.count} OrderItems.`);

  const orders = await prisma.order.deleteMany({});
  console.log(`Deleted ${orders.count} Orders.`);

  const onlineOrders = await prisma.onlineOrder.deleteMany({});
  console.log(`Deleted ${onlineOrders.count} OnlineOrders.`);

  const recipes = await prisma.recipeIngredient.deleteMany({});
  console.log(`Deleted ${recipes.count} RecipeIngredients.`);

  const products = await prisma.product.deleteMany({});
  console.log(`Deleted ${products.count} Products.`);

  const categories = await prisma.category.deleteMany({});
  console.log(`Deleted ${categories.count} Categories.`);

  console.log('Purge completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during purge:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
