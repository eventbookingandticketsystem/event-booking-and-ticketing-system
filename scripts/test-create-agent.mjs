/**
 * End-to-end gate agent write path:
 *  1. POST /api/agents  → 201, confirm fields
 *  2. GET  /api/agents  → agent appears in list
 *  3. Cleanup: delete agent via Prisma
 *
 * Uses a signed NextAuth JWT (ORGANIZER role) — same pattern as test-create-event.mjs
 */
import { encode } from "next-auth/jwt";
import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();
const BASE = "http://localhost:3000";
const SECRET = "sBRd8NIcVYszscjFmi6k5roIIoByAPR3KUN6OH6cwRI";

const PASS = (msg) => console.log(`  ✅ ${msg}`);
const FAIL = (msg) => { console.error(`  ❌ ${msg}`); process.exitCode = 1; };

// ── 1. Find the seeded organizer user + one event they own ────────────────────
const orgUser = await p.user.findFirst({ where: { role: "ORGANIZER" } });
if (!orgUser) { FAIL("No ORGANIZER user found"); await p.$disconnect(); process.exit(1); }

const orgProfile = await p.orgProfile.findFirst({ where: { userId: orgUser.id } });
if (!orgProfile) { FAIL("No orgProfile for organizer"); await p.$disconnect(); process.exit(1); }

const event = await p.event.findFirst({ where: { orgProfileId: orgProfile.id } });
if (!event) { FAIL("No events for organizer"); await p.$disconnect(); process.exit(1); }

console.log(`\n=== Organizer: ${orgUser.phone} | Event: ${event.title.slice(0,40)}\n`);

// ── 2. Mint a test JWT ────────────────────────────────────────────────────────
const token = await encode({
  token: { id: orgUser.id, role: orgUser.role, phone: orgUser.phone, sub: orgUser.id },
  secret: SECRET,
});
const cookie = `next-auth.session-token=${token}`;

// ── 3. POST /api/agents ───────────────────────────────────────────────────────
console.log("── POST /api/agents ──");

const agentPayload = {
  name:    "Test Agent Akec Deng",
  phone:   "+211922481099",
  gate:    "Gate B",
  eventId: event.id,
};

const postRes = await fetch(`${BASE}/api/agents`, {
  method:  "POST",
  headers: { "Content-Type": "application/json", Cookie: cookie },
  body:    JSON.stringify(agentPayload),
});

const postBody = await postRes.json();
console.log("Status:", postRes.status);
console.log("Body:", JSON.stringify(postBody, null, 2));

if (postRes.status !== 201) { FAIL(`Expected 201, got ${postRes.status}`); await p.$disconnect(); process.exit(1); }

const created = postBody.data;
typeof created.id       === "string"  ? PASS(`id: string (${created.id.slice(0,8)}...)`) : FAIL(`id: ${typeof created.id}`);
created.name === agentPayload.name    ? PASS(`name: "${created.name}"`) : FAIL(`name mismatch: "${created.name}"`);
created.phone === agentPayload.phone  ? PASS(`phone: "${created.phone}"`) : FAIL(`phone mismatch`);
created.gate === agentPayload.gate    ? PASS(`gate: "${created.gate}"`) : FAIL(`gate mismatch`);
created.status === "ACTIVE"           ? PASS(`status: "ACTIVE"`) : FAIL(`status: "${created.status}"`);
typeof created.event?.title === "string" ? PASS(`event.title: "${created.event.title}"`) : FAIL(`event.title missing`);

const agentId = created.id;

// ── 4. GET /api/agents — confirm agent appears ────────────────────────────────
console.log("\n── GET /api/agents ──");

const getRes = await fetch(`${BASE}/api/agents?eventId=${event.id}`, {
  headers: { Cookie: cookie },
});
const getBody = await getRes.json();
console.log("Status:", getRes.status);

getRes.status === 200 ? PASS("GET 200") : FAIL(`GET status ${getRes.status}`);

const found = getBody.data?.find((a) => a.id === agentId);
found ? PASS(`Agent ${agentId.slice(0,8)}... appears in list`) : FAIL("Agent not found in list");
if (found) {
  found.event?.title ? PASS(`list item has event.title: "${found.event.title}"`) : FAIL("list item missing event.title");
}

// ── 5. 400 validation — name < 2 chars ───────────────────────────────────────
console.log("\n── 400 validation ──");
const badRes = await fetch(`${BASE}/api/agents`, {
  method:  "POST",
  headers: { "Content-Type": "application/json", Cookie: cookie },
  body:    JSON.stringify({ name: "X", phone: "+211922481099", gate: "Gate A", eventId: event.id }),
});
badRes.status === 400 ? PASS("400 on name < 2 chars") : FAIL(`Expected 400, got ${badRes.status}`);

// ── 6. Cleanup ────────────────────────────────────────────────────────────────
console.log("\n── Cleanup ──");
await p.gateAgent.delete({ where: { id: agentId } });
PASS(`Deleted test agent ${agentId.slice(0,8)}...`);

await p.$disconnect();
console.log();
if (process.exitCode === 1) {
  console.error("❌ FAIL\n");
} else {
  console.log("✅ ALL PASS — agents write path verified end-to-end.\n");
  console.log("OBSERVED:");
  console.log("  • POST /api/agents → 201, fields: id(string), name, phone, gate, status=ACTIVE, event.title");
  console.log("  • GET  /api/agents?eventId=... → agent appears, event.title present");
  console.log("  • 400 on name < 2 chars");
}
