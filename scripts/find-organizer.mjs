import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
const users = await p.user.findMany({
  where: { role: "ORGANIZER" },
  select: { id: true, name: true, phone: true, email: true, role: true },
  take: 5,
});
console.log(JSON.stringify(users, null, 2));
await p.$disconnect();
