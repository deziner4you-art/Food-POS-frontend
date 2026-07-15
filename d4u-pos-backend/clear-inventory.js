const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Clearing RecipeIngredients...');
  await prisma.recipeIngredient.deleteMany({});
  
  console.log('Clearing PurchaseOrderItems & TransitLosses...');
  await prisma.transitLoss.deleteMany({});
  await prisma.purchaseOrderItem.deleteMany({});
  
  console.log('Clearing InventoryTransactionLogs...');
  await prisma.inventoryTransactionLog.deleteMany({});
  
  console.log('Clearing InventoryItems...');
  await prisma.inventoryItem.deleteMany({});
  
  console.log('Inventory successfully cleared.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
