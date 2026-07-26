const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.user.findMany().then(users => {
  console.log(users.map(u => ({ id: u.id, name: u.name, phone: u.phone, role: u.role_id })));
  prisma.$disconnect();
});
