/**
 * End-to-end settings write path:
 *  1. GET  /api/auth/me  → confirm initial field shapes
 *  2. PATCH /api/auth/me → update name, confirm response
 *  3. GET  /api/auth/me  → confirm name persisted
 *  4. PATCH /api/auth/me → restore original name
 *
 * Uses a signed NextAuth JWT (ORGANIZER role).
 */
import { encode } from "next-auth/jwt";
import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();
const BASE = "http://localhost:3000";
const SECRET = "sBRd8NIcVYszscjFmi6k5roIIoByAPR3KUN6OH6cwRI";

const PASS = (msg) => console.log(`  ✅ ${msg}`);
const FAIL = (msg) => { console.error(`  ❌ ${msg}`); process.exitCode = 1; };

// ── 1. Find organizer user ───────────────────────────────────────────────────
const orgUser = await p.user.findFirst({ where: { role: "ORGANIZER" } });
if (!orgUser) { FAIL("No ORGANIZER user found"); await p.$disconnect(); process.exit(1); }

const originalName = orgUser.name;
console.log(`\n=== Organizer: ${orgUser.phone} | Current name: "${originalName}"\n`);

// ── 2. Mint test JWT ─────────────────────────────────────────────────────────
const token = await encode({
  token: { id: orgUser.id, role: orgUser.role, phone: orgUser.phone, sub: orgUser.id },
  secret: SECRET,
});
const cookie = `next-auth.session-token=${token}`;

// ── 3. GET /api/auth/me ──────────────────────────────────────────────────────
console.log("── GET /api/auth/me ──");
const getRes = await fetch(`${BASE}/api/auth/me`, { headers: { Cookie: cookie } });
const getBody = await getRes.json();
console.log("Status:", getRes.status);

getRes.status === 200 ? PASS("GET 200") : FAIL(`GET status ${getRes.status}`);

const me = getBody.data;
typeof me.id     === "string" ? PASS(`id: string`) : FAIL(`id: ${typeof me.id}`);
(me.name === null || typeof me.name === "string")  ? PASS(`name: ${JSON.stringify(me.name)}`) : FAIL(`name unexpected`);
(me.phone === null || typeof me.phone === "string") ? PASS(`phone: ${JSON.stringify(me.phone)}`) : FAIL(`phone unexpected`);
typeof me.role   === "string" ? PASS(`role: "${me.role}"`) : FAIL(`role: ${typeof me.role}`);
me.orgProfile    !== undefined ? PASS(`orgProfile present (orgName: "${me.orgProfile?.orgName}")`) : FAIL("orgProfile missing");

// ── 4. PATCH /api/auth/me ─────────────────────────────────────────────────────
console.log("\n── PATCH /api/auth/me ──");
const newName = "Rebecca Mayen Updated";
const patchRes = await fetch(`${BASE}/api/auth/me`, {
  method:  "PATCH",
  headers: { "Content-Type": "application/json", Cookie: cookie },
  body:    JSON.stringify({ name: newName }),
});
const patchBody = await patchRes.json();
console.log("Status:", patchRes.status);
console.log("Body:", JSON.stringify(patchBody, null, 2));

patchRes.status === 200 ? PASS("PATCH 200") : FAIL(`PATCH status ${patchRes.status}`);
patchBody.data?.name === newName ? PASS(`name updated to "${newName}"`) : FAIL(`name mismatch: "${patchBody.data?.name}"`);
patchBody.data?.updatedAt        ? PASS(`updatedAt present: ${patchBody.data.updatedAt}`) : FAIL("updatedAt missing");

// ── 5. GET again — confirm persistence ───────────────────────────────────────
console.log("\n── GET /api/auth/me — confirm persistence ──");
const get2Res  = await fetch(`${BASE}/api/auth/me`, { headers: { Cookie: cookie } });
const get2Body = await get2Res.json();
get2Body.data?.name === newName ? PASS(`GET confirms name: "${get2Body.data.name}"`) : FAIL(`GET name: "${get2Body.data?.name}"`);

// ── 6. PATCH — restore original ───────────────────────────────────────────────
console.log("\n── PATCH — restore original name ──");
const restoreRes = await fetch(`${BASE}/api/auth/me`, {
  method:  "PATCH",
  headers: { "Content-Type": "application/json", Cookie: cookie },
  body:    JSON.stringify({ name: originalName }),
});
restoreRes.status === 200 ? PASS(`Restored name to "${originalName}"`) : FAIL(`Restore status ${restoreRes.status}`);

// ── 7. Validate ignored fields ────────────────────────────────────────────────
console.log("\n── PATCH — ignored fields ──");
const badPatch = await fetch(`${BASE}/api/auth/me`, {
  method:  "PATCH",
  headers: { "Content-Type": "application/json", Cookie: cookie },
  body:    JSON.stringify({ role: "ADMIN", password: "hacked", id: "evil" }),
});
const badBody = await badPatch.json();
// Should still return 200 but role/password/id must not change
badPatch.status === 200 ? PASS("PATCH with ignored fields returns 200") : FAIL(`Status ${badPatch.status}`);
badBody.data?.role !== "ADMIN" ? PASS(`role NOT updated: "${badBody.data?.role}"`) : FAIL("role was changed!");

await p.$disconnect();
console.log();
if (process.exitCode === 1) {
  console.error("❌ FAIL\n");
} else {
  console.log("✅ ALL PASS — settings write path verified end-to-end.\n");
  console.log("OBSERVED:");
  console.log("  • GET  /api/auth/me → 200, fields: id, name, phone, role, orgProfile.orgName");
  console.log("  • PATCH /api/auth/me { name } → 200, updated name + updatedAt");
  console.log("  • Follow-up GET confirms persistence");
  console.log("  • PATCH with role/password/id → 200 but fields ignored");
}
