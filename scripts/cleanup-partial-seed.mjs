import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const r = await prisma.user.deleteMany({ where: { email: 'seed+org@tiketi.dev' } });
console.log('Deleted', r.count, 'partial seed user(s)');
await prisma.$disconnect();
