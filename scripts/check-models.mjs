import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
console.log('scanRecord:', typeof prisma.scanRecord);
console.log('gateAgent:', typeof prisma.gateAgent);
console.log('bookingLine:', typeof prisma.bookingLine);
console.log('tierModel:', typeof prisma.tierModel);
console.log('ticketTier:', typeof prisma.ticketTier);
await prisma.$disconnect();
