const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = 'khaih3222@gmail.com';
  const passwordHash = await bcrypt.hash('Admin@123', 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      role: 'ADMIN',
    },
    create: {
      email,
      name: 'Admin Khải',
      passwordHash,
      role: 'ADMIN',
    },
  });

  console.log('Admin user updated/created:', user.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
