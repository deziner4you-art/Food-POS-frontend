const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const u = await prisma.user.findUnique({ where: { phone: 'deziner4you' }, include: { role: true } });
  console.log(u);
}
main().catch(console.error).finally(() => {
  prisma.$disconnect();
});
