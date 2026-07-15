const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- Campaigns ---');
  console.log(await prisma.marketingCampaign.findMany({ where: { title: { startsWith: '[AUTO]' } } }));
  console.log('--- Scheduled Discounts ---');
  console.log(await prisma.scheduledDiscount.findMany());
}

main().finally(() => prisma.$disconnect());
