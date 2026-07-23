
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'test@example.com';
  const password = 'password123';
  const passwordHash = await bcrypt.hash(password, 10);

  let user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        name: 'Test User',
        passwordHash,
        provider: 'EMAIL',
      },
    });
    console.log('Created user:', user.email);
  } else {
    // update password to be sure
    await prisma.user.update({
      where: { email },
      data: { passwordHash }
    });
    console.log('User already exists, updated password for:', user.email);
  }

  const sub = await prisma.subscription.findUnique({
    where: { userId: user.id }
  });

  if (!sub) {
    await prisma.subscription.create({
      data: {
        userId: user.id,
        plan: 'PRO',
        status: 'ACTIVE',
        messagesLimit: 2000,
        documentsLimit: 100
      }
    });
    console.log('Created PRO subscription for user.');
  } else {
    await prisma.subscription.update({
      where: { userId: user.id },
      data: {
        plan: 'PRO',
        status: 'ACTIVE',
        messagesLimit: 2000,
        documentsLimit: 100
      }
    });
    console.log('Updated subscription to PRO.');
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

