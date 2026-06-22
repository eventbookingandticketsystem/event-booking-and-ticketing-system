/**
 * Tiketi API Smoke Test — All 17 Steps
 *
 * Runs against the Next.js production server at localhost:3000.
 * Mints real next-auth v4 JWTs for protected routes.
 *
 * Usage:  node scripts/smoke-test.mjs
 */

import { PrismaClient }  from "@prisma/client";
import { encode }        from "next-auth/jwt";
import { createHash }    from "crypto";
import { readFileSync }  from "fs";
import { fileURLToPath } from "url";
import path              from "path";
import bcrypt            from "bcryptjs";

// ── Config ────────────────────────────────────────────────────────────────
const BASE   = "http://localhost:3000";
const SECRET = process.env.NEXTAUTH_SECRET;
const SALT   = "";                           // next-auth v4 default salt
const COOKIE = "next-auth.session-token";    // next-auth v4 cookie name
const DATE_30_DAYS = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

if (!SECRET) { console.error("NEXTAUTH_SECRET not set"); process.exit(1); }

const prisma = new PrismaClient();

// ── Helpers ───────────────────────────────────────────────────────────────
let passed = 0, failed = 0;
const results = [];

function log(step, label, ok, detail = "") {
  const mark = ok ? "✅ PASS" : "❌ FAIL";
  const line = `STEP ${String(step).padStart(2,"0")} — ${mark}  ${label}`;
  console.log(line);
  if (detail) console.log("    " + detail.replace(/\n/g, "\n    "));
  results.push({ step, label, ok });
  ok ? passed++ : failed++;
}

function assert(step, label, condition, detail = "") {
  log(step, label, condition, condition ? "" : detail);
  return condition;
}

async function mintCookie(payload) {
  const tok = await encode({ token: payload, secret: SECRET, salt: SALT, maxAge: 3600 });
  return `${COOKIE}=${tok}`;
}

async function api(method, path, body, cookie) {
  const headers = { "Content-Type": "application/json" };
  if (cookie) headers["Cookie"] = cookie;
  const init = { method, headers };
  if (body) init.body = JSON.stringify(body);
  try {
    const r = await fetch(`${BASE}${path}`, init);
    let data;
    const text = await r.text();
    try { data = JSON.parse(text); } catch { data = { _raw: text }; }
    return { status: r.status, data };
  } catch (e) {
    return { status: 0, data: { message: e.message } };
  }
}

// ── Clean up prior smoke test data ────────────────────────────────────────
async function cleanup() {
  console.log("\n🧹 Cleaning up prior smoke test data...");
  const users = await prisma.user.findMany({
    where: { OR: [
      { email: { startsWith: "smoke+" } },
      { name:  { startsWith: "Smoke"  } },
    ]},
    select: { id: true },
  });
  for (const u of users) {
    await prisma.session.deleteMany({ where: { userId: u.id } });
    await prisma.account.deleteMany({ where: { userId: u.id } });
    await prisma.ticket.deleteMany({ where: { ownerId: u.id } });
    await prisma.booking.deleteMany({ where: { userId: u.id } });
    await prisma.orgProfile.deleteMany({ where: { userId: u.id } });
    await prisma.agentProfile.deleteMany({ where: { userId: u.id } });
  }
  // Clean up smoke events
  const events = await prisma.event.findMany({
    where: { title: { contains: "Smoke Test" } },
    include: { gateAgents: { select: { id: true } } },
  });
  for (const ev of events) {
    for (const ag of ev.gateAgents) {
      await prisma.scanRecord.deleteMany({ where: { agentId: ag.id } });
    }
    await prisma.gateAgent.deleteMany({ where: { eventId: ev.id } });
    await prisma.scanRecord.deleteMany({ where: { eventId: ev.id } });
    await prisma.ticket.deleteMany({ where: { eventId: ev.id } });
    const bookings = await prisma.booking.findMany({ where: { eventId: ev.id }, select: { id: true } });
    for (const b of bookings) {
      await prisma.bookingLine.deleteMany({ where: { bookingId: b.id } });
    }
    await prisma.booking.deleteMany({ where: { eventId: ev.id } });
    await prisma.ticketTier.deleteMany({ where: { eventId: ev.id } });
    await prisma.event.delete({ where: { id: ev.id } });
  }
  if (users.length > 0) await prisma.user.deleteMany({ where: { id: { in: users.map(u => u.id) } } });
  console.log(`   Removed ${users.length} user(s) and ${events.length} event(s).\n`);
}

// ── Main ──────────────────────────────────────────────────────────────────
async function run() {
  console.log("═══════════════════════════════════════════════════");
  console.log("  Tiketi Smoke Test — 17 Steps");
  console.log("═══════════════════════════════════════════════════\n");

  await cleanup();

  let attendeeId, attendeeCookie;
  let orgId, orgCookie, orgProfileId;
  let eventId, generalTierId, vipTierId;
  let bookingId, bookingRef;
  let savedQrPayload, savedTicketRef;
  let agentId;

  // ── STEP 1: Register attendee ──────────────────────────────────────────
  {
    const r = await api("POST", "/api/auth/register", {
      name: "Smoke Attendee",
      email: "smoke+attendee@test.com",
      phone: "+211900000001",
      password: "password123",
      role: "ATTENDEE",
    });
    const ok1 = r.status === 201 && r.data.success && r.data.data?.role === "ATTENDEE";
    const noPass = !r.data.data?.password;
    assert(1, "Register attendee → 201, role=ATTENDEE, no password",
      ok1 && noPass,
      `status=${r.status} role=${r.data.data?.role} hasPassword=${!!r.data.data?.password}\n${JSON.stringify(r.data,null,2)}`);
    attendeeId = r.data.data?.id;
  }

  // ── STEP 2: Register organizer ─────────────────────────────────────────
  {
    const r = await api("POST", "/api/auth/register", {
      name: "Smoke Organizer",
      email: "smoke+org@test.com",
      phone: "+211900000002",
      password: "password123",
      role: "ORGANIZER",
      orgName: "Smoke Events Ltd",
    });
    const ok2 = r.status === 201 && r.data.success;
    const orgProfile = await prisma.orgProfile.findFirst({ where: { user: { email: "smoke+org@test.com" } } });
    const hasProfile = !!orgProfile;
    assert(2, "Register organizer → 201, OrgProfile created in DB",
      ok2 && hasProfile,
      `status=${r.status} hasOrgProfile=${hasProfile}\n${JSON.stringify(r.data,null,2)}`);
    orgId = r.data.data?.id;
    orgProfileId = orgProfile?.id;
  }

  // ── STEP 3: Duplicate registration guard ──────────────────────────────
  {
    const r = await api("POST", "/api/auth/register", {
      name: "Dup", email: "smoke+attendee@test.com", phone: "+211900000009",
      password: "password123", role: "ATTENDEE",
    });
    const count = await prisma.user.count({ where: { email: "smoke+attendee@test.com" } });
    assert(3, "Duplicate registration → 400, no second user",
      r.status === 400 && count === 1,
      `status=${r.status} userCount=${count}`);
  }

  // ── STEP 4: "Login" — mint organizer JWT, verify /api/auth/me ─────────
  {
    const orgUser = await prisma.user.findUnique({ where: { email: "smoke+org@test.com" }, select: { id: true, role: true, phone: true, email: true, name: true } });
    orgId = orgUser.id;
    orgCookie = await mintCookie({ id: orgUser.id, role: orgUser.role, phone: orgUser.phone, email: orgUser.email, name: orgUser.name });
    const r = await api("GET", "/api/auth/me", null, orgCookie);
    const ok4 = r.status === 200 && r.data.data?.role === "ORGANIZER";
    assert(4, "Mint organizer JWT → GET /me returns role=ORGANIZER",
      ok4,
      `status=${r.status} role=${r.data.data?.role}`);
  }

  // ── STEP 5: Create event (as organizer) ───────────────────────────────
  {
    const r = await api("POST", "/api/events", {
      title: "Smoke Test Concert 2026",
      description: "A test event with enough description chars for the schema",
      venue: "Test Arena",
      city: "Juba",
      date: DATE_30_DAYS,
      time: "19:00",
      category: "Music",
      featured: true,
      tiers: [
        { name: "General", price: 50,  capacity: 100 },
        { name: "VIP",     price: 150, capacity: 10  },
      ],
    }, orgCookie);

    const ok5 = r.status === 201 && r.data.success;
    const tiers = r.data.data?.tiers ?? [];
    const tiersOk = tiers.length === 2 && tiers.every(t => t.remaining === t.capacity);
    assert(5, "Create event → 201, 2 tiers, each remaining===capacity",
      ok5 && tiersOk,
      `status=${r.status} tiers=${JSON.stringify(tiers.map(t=>({name:t.name,remaining:t.remaining,capacity:t.capacity})))}`);
    eventId      = r.data.data?.id;
    generalTierId = tiers.find(t => t.name === "General")?.id;
    vipTierId     = tiers.find(t => t.name === "VIP")?.id;
  }

  // ── STEP 6: Public event list ─────────────────────────────────────────
  {
    const [r1, r2, r3] = await Promise.all([
      api("GET", "/api/events"),
      api("GET", "/api/events?featured=true"),
      api("GET", "/api/events?search=Smoke"),
    ]);
    const inAll      = r1.data.data?.some(e => e.id === eventId);
    const inFeatured = r2.data.data?.some(e => e.id === eventId);
    const inSearch   = r3.data.data?.some(e => e.id === eventId);
    assert(6, "Public event list — event appears in all/featured/search",
      r1.status === 200 && inAll && inFeatured && inSearch,
      `all=${inAll} featured=${inFeatured} search=${inSearch}`);
  }

  // ── STEP 7: Book tickets (as attendee) ────────────────────────────────
  {
    const attUser = await prisma.user.findUnique({ where: { email: "smoke+attendee@test.com" }, select: { id:true, role:true, phone:true, email:true, name:true } });
    attendeeId   = attUser.id;
    attendeeCookie = await mintCookie({ id: attUser.id, role: attUser.role, phone: attUser.phone, email: attUser.email, name: attUser.name });

    const r = await api("POST", "/api/bookings", {
      eventId,
      method: "MTN",
      lines: [
        { tierId: generalTierId, qty: 3 },
        { tierId: vipTierId,     qty: 2 },
      ],
    }, attendeeCookie);

    bookingId  = r.data.data?.id;
    bookingRef = r.data.data?.ref;
    const tickets = r.data.data?.tickets ?? [];
    const refOk   = bookingRef?.startsWith("BKG-");
    const count5  = tickets.length === 5;
    const tixRefOk = tickets.every(t => /^TIX-[A-F0-9]{4}-[A-F0-9]{4}$/.test(t.ticketRef));

    // Verify qrPayload format and tier remaining via DB
    const [dbGeneral, dbVip] = await Promise.all([
      prisma.ticketTier.findUnique({ where: { id: generalTierId }, select: { remaining: true } }),
      prisma.ticketTier.findUnique({ where: { id: vipTierId     }, select: { remaining: true } }),
    ]);
    const generalOk = dbGeneral?.remaining === 97;
    const vipOk     = dbVip?.remaining     === 8;

    // Check qrPayload format
    const qrOk = tickets.every(t => t.ticketRef && t.ticketRef.length > 0);
    const subtotal = r.data.data?.subtotal;
    const subtotalOk = subtotal === (3 * 50 + 2 * 150); // 450

    // Save a general ticket for scan tests
    const generalTicket = tickets.find(t => {
      const dbTick = r.data.data?.tickets?.find(x => x.tier === "General");
      return t.tier === "General";
    });
    if (generalTicket) {
      // Fetch full ticket from DB to get qrPayload
      const dbTick = await prisma.ticket.findUnique({ where: { ticketRef: generalTicket.ticketRef }, select: { qrPayload: true, ticketRef: true } });
      savedQrPayload = dbTick?.qrPayload;
      savedTicketRef = generalTicket.ticketRef;
    }

    const ok7 = r.status === 201 && refOk && count5 && tixRefOk && generalOk && vipOk && subtotalOk;
    assert(7, "Book tickets → 201, 5 tickets, tiers decremented, subtotal=450",
      ok7,
      `status=${r.status} ref=${bookingRef} tickets=${tickets.length} tixRefOk=${tixRefOk} ` +
      `general.remaining=${dbGeneral?.remaining}(exp 97) vip.remaining=${dbVip?.remaining}(exp 8) ` +
      `subtotal=${subtotal}(exp 450) qrPayload=${savedQrPayload?.substring(0,30)}...`);
  }

  // ── STEP 8: Over-capacity guard ───────────────────────────────────────
  {
    const r = await api("POST", "/api/bookings", {
      eventId, method: "MTN",
      lines: [{ tierId: vipTierId, qty: 999 }],
    }, attendeeCookie);
    const vip = await prisma.ticketTier.findUnique({ where: { id: vipTierId }, select: { remaining: true } });
    assert(8, "Over-capacity → 400, VIP remaining still 8",
      r.status === 400 && vip?.remaining === 8,
      `status=${r.status} vip.remaining=${vip?.remaining}`);
  }

  // ── STEP 9: Confirm payment ────────────────────────────────────────────
  {
    const r = await api("PATCH", `/api/bookings/${bookingId}`, { status: "CONFIRMED" }, attendeeCookie);
    const ok9 = r.status === 200 && r.data.data?.status === "CONFIRMED" && !!r.data.data?.paidAt;
    assert(9, "Confirm booking → 200, status=CONFIRMED, paidAt set",
      ok9,
      `status=${r.status} bookingStatus=${r.data.data?.status} paidAt=${r.data.data?.paidAt}`);
  }

  // ── STEP 10: Attendee tickets list ────────────────────────────────────
  {
    const [r1, r2] = await Promise.all([
      api("GET", "/api/tickets", null, attendeeCookie),
      api("GET", "/api/tickets?status=VALID", null, attendeeCookie),
    ]);
    const count     = r1.data.data?.length;
    const hasEvent  = r1.data.data?.[0]?.event?.id === eventId;
    const countValid = r2.data.data?.length;
    assert(10, "Attendee tickets → 5 tickets with event info",
      r1.status === 200 && count === 5 && hasEvent && countValid === 5,
      `status=${r1.status} count=${count} hasEvent=${hasEvent} validCount=${countValid}`);
  }

  // ── STEP 11: Create gate agent ─────────────────────────────────────────
  {
    const r = await api("POST", "/api/agents", {
      name: "Smoke Gate", phone: "+211900000003", gate: "Gate A", eventId,
    }, orgCookie);
    agentId = r.data.data?.id;
    assert(11, "Create gate agent → 201, status=ACTIVE",
      r.status === 201 && r.data.data?.status === "ACTIVE",
      `status=${r.status} agentStatus=${r.data.data?.status} agentId=${agentId}`);
  }

  // ── STEP 12: SCAN — first admit ────────────────────────────────────────
  {
    if (!savedQrPayload || !agentId) {
      log(12, "SCAN admit — SKIPPED (no qrPayload or agentId)", false, `qrPayload=${savedQrPayload} agentId=${agentId}`);
    } else {
      const r = await api("POST", "/api/scan", {
        qrPayload: savedQrPayload, eventId, gate: "Gate A", agentId,
      }, orgCookie);

      const isAdmit   = r.data.data?.result === "ADMIT";
      const hasName   = !!r.data.data?.attendee;
      const hasTier   = !!r.data.data?.tier;

      // DB assertions
      const [dbTicket, dbAgent, dbScan] = await Promise.all([
        prisma.ticket.findUnique({ where: { ticketRef: savedTicketRef }, select: { status: true, usedAt: true } }),
        prisma.gateAgent.findUnique({ where: { id: agentId }, select: { scansToday: true } }),
        prisma.scanRecord.findFirst({ where: { agentId, result: "ADMIT" }, orderBy: { scannedAt: "desc" } }),
      ]);

      const ticketUsed    = dbTicket?.status  === "USED";
      const usedAtSet     = !!dbTicket?.usedAt;
      const scansToday1   = dbAgent?.scansToday === 1;
      const scanRecordOk  = !!dbScan;

      assert(12, "SCAN admit → result=ADMIT, ticket=USED, scansToday=1, ScanRecord created",
        r.status === 200 && isAdmit && ticketUsed && usedAtSet && scansToday1 && scanRecordOk,
        `status=${r.status} result=${r.data.data?.result} attendee=${r.data.data?.attendee} ` +
        `ticket.status=${dbTicket?.status} usedAt=${dbTicket?.usedAt} scansToday=${dbAgent?.scansToday} scanRecord=${!!dbScan}`);
    }
  }

  // ── STEP 13: SCAN — already used ──────────────────────────────────────
  {
    if (!savedQrPayload) {
      log(13, "SCAN already-used — SKIPPED", false, "No qrPayload");
    } else {
      const r = await api("POST", "/api/scan", {
        qrPayload: savedQrPayload, eventId, gate: "Gate A", agentId,
      }, orgCookie);

      const isAlreadyUsed = r.data.data?.result === "ALREADY_USED";
      const scanCount = await prisma.scanRecord.count({ where: { agentId, ticketRef: savedTicketRef } });
      const dbAgent   = await prisma.gateAgent.findUnique({ where: { id: agentId }, select: { scansToday: true } });

      assert(13, "Re-scan → result=ALREADY_USED, second ScanRecord, scansToday NOT incremented",
        r.status === 200 && isAlreadyUsed && scanCount >= 2 && dbAgent?.scansToday === 1,
        `status=${r.status} result=${r.data.data?.result} scanCount=${scanCount} scansToday=${dbAgent?.scansToday}`);
    }
  }

  // ── STEP 14: SCAN — wrong event ───────────────────────────────────────
  {
    if (!savedQrPayload) {
      log(14, "SCAN wrong-event — SKIPPED", false, "No qrPayload");
    } else {
      // Fake ObjectId for wrong event
      const wrongEventId = "aaaaaaaaaaaaaaaaaaaaaaaa";
      const r = await api("POST", "/api/scan", {
        qrPayload: savedQrPayload, eventId: wrongEventId, gate: "Gate A", agentId,
      }, orgCookie);
      assert(14, "Wrong event → result=WRONG_EVENT",
        r.status === 200 && r.data.data?.result === "WRONG_EVENT",
        `status=${r.status} result=${r.data.data?.result}`);
    }
  }

  // ── STEP 15: SCAN — invalid payload ───────────────────────────────────
  {
    const r = await api("POST", "/api/scan", {
      qrPayload: "garbage", eventId, gate: "Gate A", agentId,
    }, orgCookie);
    const scanRecord = await prisma.scanRecord.findFirst({
      where: { agentId, result: "INVALID" }, orderBy: { scannedAt: "desc" },
    });
    assert(15, "Garbage payload → result=INVALID, ScanRecord created",
      r.status === 200 && r.data.data?.result === "INVALID" && !!scanRecord,
      `status=${r.status} result=${r.data.data?.result} scanRecord=${!!scanRecord}`);
  }

  // ── STEP 16: Admin stats ───────────────────────────────────────────────
  {
    // Create admin user directly via Prisma
    const pwHash = await bcrypt.hash("admin123", 10);
    const admin  = await prisma.user.upsert({
      where:  { email: "smoke+admin@test.com" },
      create: { name: "Smoke Admin", email: "smoke+admin@test.com", phone: "+211900000099", password: pwHash, role: "ADMIN" },
      update: { role: "ADMIN" },
    });
    const adminCookie = await mintCookie({ id: admin.id, role: "ADMIN", email: admin.email, name: admin.name });

    const [rStats, rUsers] = await Promise.all([
      api("GET", "/api/admin/stats", null, adminCookie),
      api("GET", "/api/admin/users?search=smoke", null, adminCookie),
    ]);

    const statsOk  = rStats.status === 200 && rStats.data.data?.ticketsAllTime >= 5;
    const trendOk  = rStats.data.data?.salesTrend?.length === 14;
    const usersOk  = rUsers.status === 200 && rUsers.data.data?.length >= 2;

    assert(16, "Admin stats → ticketsAllTime≥5, salesTrend has 14 days, smoke users visible",
      statsOk && trendOk && usersOk,
      `stats.status=${rStats.status} ticketsAllTime=${rStats.data.data?.ticketsAllTime} ` +
      `trendLen=${rStats.data.data?.salesTrend?.length} users.status=${rUsers.status} usersFound=${rUsers.data.data?.length}`);
  }

  // ── STEP 17: Organizer dashboard ─────────────────────────────────────
  {
    const r = await api("GET", `/api/organizer/dashboard?eventId=${eventId}`, null, orgCookie);
    const d = r.data.data ?? {};

    const admittedOk  = d.admitted  === 1;
    const capacityOk  = d.capacity  === 110;  // 100 General + 10 VIP
    const soldOk      = d.sold      === 5;    // 3 General + 2 VIP
    const revenueOk   = d.revenue   === 450;  // CONFIRMED booking
    const tiersOk     = Array.isArray(d.tiers)  && d.tiers.length  === 2;
    const scansOk     = Array.isArray(d.scans)  && d.scans.length  >= 1;
    const entryOk     = Array.isArray(d.entryRate);
    const fraudOk     = d.fraud     >= 2;     // ALREADY_USED + WRONG_EVENT + INVALID (non-ADMIT scans)

    assert(17, "Organizer dashboard → admitted=1, capacity=110, sold=5, revenue=450, fraud≥2",
      r.status === 200 && admittedOk && capacityOk && soldOk && revenueOk && tiersOk && scansOk && fraudOk,
      `status=${r.status} admitted=${d.admitted}(exp 1) capacity=${d.capacity}(exp 110) ` +
      `sold=${d.sold}(exp 5) revenue=${d.revenue}(exp 450) fraud=${d.fraud}(exp ≥2) ` +
      `tiers=${d.tiers?.length} scans=${d.scans?.length} entryRate=${d.entryRate?.length}`);
  }

  // ── Summary ──────────────────────────────────────────────────────────
  console.log("\n═══════════════════════════════════════════════════");
  console.log("  SUMMARY");
  console.log("═══════════════════════════════════════════════════");
  for (const r of results) {
    const mark = r.ok ? "✅" : "❌";
    console.log(`  ${mark}  Step ${String(r.step).padStart(2,"0")}: ${r.label}`);
  }
  console.log(`\n  ${passed}/${passed+failed} passed`);
  if (failed > 0) console.log(`  ${failed} FAILED — see output above for details`);
  else console.log("  All steps PASSED ✅");

  // ── Cleanup note ──────────────────────────────────────────────────────
  console.log("\n📝 Test data left in DB:");
  console.log("   Users:  smoke+attendee@test.com, smoke+org@test.com, smoke+admin@test.com");
  console.log("   Event:  'Smoke Test Concert 2026'");
  console.log("   Run the script again to clean up before re-running.\n");

  await prisma.$disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

run().catch(e => { console.error("Fatal:", e); prisma.$disconnect(); process.exit(1); });
