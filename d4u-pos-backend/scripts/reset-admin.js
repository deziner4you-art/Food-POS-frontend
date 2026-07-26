const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const readline = require('readline');

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const askQuestion = (query) => new Promise(resolve => rl.question(query, resolve));

async function resetPassword() {
  console.log('\n--- SUPER ADMIN PASSWORD RESET UTILITY ---\n');

  try {
    const phone = await askQuestion('Enter Username or Phone Number: ');
    const newPassword = await askQuestion('Enter Temporary Password: ');
    const reason = await askQuestion('Enter Reason for Reset: ');
    const confirm = await askQuestion('Are you sure you want to reset this password? (y/N): ');

    if (confirm.toLowerCase() !== 'y') {
      console.log('Reset cancelled.');
      process.exit(0);
    }

    if (!phone || !newPassword || !reason) {
      console.error('Error: Username, Password, and Reason are required.');
      process.exit(1);
    }

    const user = await prisma.user.findUnique({
      where: { phone }
    });

    if (!user) {
      console.error(`Error: User with phone/username '${phone}' not found.`);
      process.exit(1);
    }

    const hashedPin = await bcrypt.hash(newPassword, 10);
    
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { 
          hashedPin: hashedPin,
          must_change_password: true,
          password_reset_at: new Date()
        }
      }),
      prisma.systemAuditLog.create({
        data: {
          action: 'PASSWORD_RESET',
          entity: 'USER',
          entity_id: user.id,
          user_name: 'CLI Utility',
          details: { reason, reset_target: phone }
        }
      })
    ]);

    console.log(`\n✅ Password for '${phone}' has been securely reset and audited.`);
    console.log(`User will be forced to change it on next login.\n`);
  } catch (error) {
    console.error('Error during reset:', error);
  } finally {
    await prisma.$disconnect();
    rl.close();
  }
}

resetPassword();
