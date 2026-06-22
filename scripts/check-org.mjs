import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
const u = await p.user.findFirst({
  where: { phone: "+211912000001" },
  select: { id: true, name: true, phone: true, role: true, password: true },
});
console.log({
  id: u?.id,
  name: u?.name,
  phone: u?.phone,
  role: u?.role,
  hashPreview: u?.password?.slice(0, 20),
});
// Also check orgProfile
const org = await p.orgProfile.findUnique({
  where: { userId: u?.id },
  select: { id: true, orgName: true },
});
console.log("orgProfile:", org);
await p.$disconnect();
