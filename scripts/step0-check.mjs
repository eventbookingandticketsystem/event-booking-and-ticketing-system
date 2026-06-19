import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

try {
  const count = await prisma.user.count();
  console.log('CONNECTED OK — user count:', count);
  await prisma.$disconnect();
} catch (e) {
  console.error('FAILED:', e.message);
  await prisma.$disconnect().catch(() => {});
  process.exit(1);
}
