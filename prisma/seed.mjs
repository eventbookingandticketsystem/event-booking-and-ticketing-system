// prisma/seed.mjs — seeds the database from mock-data.ts values
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const POSTERS = {
  concert: "linear-gradient(135deg, #08283B 0%, #14506b 55%, #FF5A00 140%)",
  concert2: "linear-gradient(150deg, #2a1a3f 0%, #6b2447 60%, #FF5A00 150%)",
  football: "linear-gradient(135deg, #08283B 0%, #1A6B3C 110%)",
  conference: "linear-gradient(140deg, #0b2b3d 0%, #466177 100%)",
  graduation: "linear-gradient(135deg, #08283B 0%, #3a2d6b 70%, #A83900 150%)",
};

async function main() {
  console.log("Seeding database…");

  // ── 1. Users ────────────────────────────────────────────────────────────
  const adminHash = await bcrypt.hash("Admin@1234", 10);
  const orgHash = await bcrypt.hash("Organizer@1234", 10);
  const attendeeHash = await bcrypt.hash("Attendee@1234", 10);
  const agentHash = await bcrypt.hash("Agent@1234", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@tiketi.ss" },
    update: {},
    create: {
      email: "admin@tiketi.ss",
      name: "System Admin",
      phone: "+211 922 000 001",
      role: "ADMIN",
      password: adminHash,
    },
  });

  // Organiser users
  const orgUsers = await Promise.all([
    prisma.user.upsert({
      where: { email: "nile@tiketi.ss" },
      update: {},
      create: {
        email: "nile@tiketi.ss",
        name: "Rebecca Mayen",
        phone: "+211 922 700 145",
        role: "ORGANIZER",
        password: orgHash,
      },
    }),
    prisma.user.upsert({
      where: { email: "ssfa@tiketi.ss" },
      update: {},
      create: {
        email: "ssfa@tiketi.ss",
        name: "Peter Bol",
        phone: "+211 955 318 220",
        role: "ORGANIZER",
        password: orgHash,
      },
    }),
    prisma.user.upsert({
      where: { email: "uoj@tiketi.ss" },
      update: {},
      create: {
        email: "uoj@tiketi.ss",
        name: "Dr. Akol Deng",
        phone: "+211 911 470 660",
        role: "ORGANIZER",
        password: orgHash,
      },
    }),
    prisma.user.upsert({
      where: { email: "amali@tiketi.ss" },
      update: {},
      create: {
        email: "amali@tiketi.ss",
        name: "Grace Lado",
        phone: "+211 928 905 412",
        role: "ORGANIZER",
        password: orgHash,
      },
    }),
    prisma.user.upsert({
      where: { email: "grace@tiketi.ss" },
      update: {},
      create: {
        email: "grace@tiketi.ss",
        name: "Simon Wani",
        phone: "+211 920 661 037",
        role: "ORGANIZER",
        password: orgHash,
      },
    }),
  ]);

  // Attendee
  const attendee = await prisma.user.upsert({
    where: { email: "achol@tiketi.ss" },
    update: {},
    create: {
      email: "achol@tiketi.ss",
      name: "Achol Deng",
      phone: "+211 911 200 001",
      role: "ATTENDEE",
      password: attendeeHash,
    },
  });

  // Gate agent users
  const agentUsers = await Promise.all([
    prisma.user.upsert({
      where: { email: "james.majok@tiketi.ss" },
      update: {},
      create: {
        email: "james.majok@tiketi.ss",
        name: "James Majok",
        phone: "+211 922 481 003",
        role: "GATE_AGENT",
        password: agentHash,
      },
    }),
    prisma.user.upsert({
      where: { email: "rebecca.aluel@tiketi.ss" },
      update: {},
      create: {
        email: "rebecca.aluel@tiketi.ss",
        name: "Rebecca Aluel",
        phone: "+211 955 102 778",
        role: "GATE_AGENT",
        password: agentHash,
      },
    }),
    prisma.user.upsert({
      where: { email: "daniel.garang@tiketi.ss" },
      update: {},
      create: {
        email: "daniel.garang@tiketi.ss",
        name: "Daniel Garang",
        phone: "+211 928 640 219",
        role: "GATE_AGENT",
        password: agentHash,
      },
    }),
    prisma.user.upsert({
      where: { email: "mary.nyibol@tiketi.ss" },
      update: {},
      create: {
        email: "mary.nyibol@tiketi.ss",
        name: "Mary Nyibol",
        phone: "+211 911 305 884",
        role: "GATE_AGENT",
        password: agentHash,
      },
    }),
  ]);

  console.log("  ✓ Users");

  // ── 2. OrgProfiles ──────────────────────────────────────────────────────
  const orgDefs = [
    { user: orgUsers[0], orgName: "Nile Live Events", contact: "Rebecca Mayen", phone: "+211 922 700 145", revenue: 37840, status: "Active", joined: new Date("2025-08-12") },
    { user: orgUsers[1], orgName: "SSFA", contact: "Peter Bol", phone: "+211 955 318 220", revenue: 7423, status: "Active", joined: new Date("2025-09-03") },
    { user: orgUsers[2], orgName: "University of Juba", contact: "Dr. Akol Deng", phone: "+211 911 470 660", revenue: 4172, status: "Active", joined: new Date("2025-07-21") },
    { user: orgUsers[3], orgName: "RwandanTechEvents", contact: "Grace Lado", phone: "+211 928 905 412", revenue: 1646, status: "Active", joined: new Date("2025-10-01") },
    { user: orgUsers[4], orgName: "Grace Arena", contact: "Simon Wani", phone: "+211 920 661 037", revenue: 292, status: "Suspended", joined: new Date("2025-10-18") },
  ];

  const orgProfiles = await Promise.all(
    orgDefs.map((o) =>
      prisma.orgProfile.upsert({
        where: { userId: o.user.id },
        update: {},
        create: {
          userId: o.user.id,
          orgName: o.orgName,
          contactName: o.contact,
          phone: o.phone,
          revenue: o.revenue,
          status: o.status,
          joinedAt: o.joined,
        },
      })
    )
  );

  console.log("  ✓ OrgProfiles");

  // ── 3. AgentProfiles ────────────────────────────────────────────────────
  await Promise.all([
    prisma.agentProfile.upsert({ where: { userId: agentUsers[0].id }, update: {}, create: { userId: agentUsers[0].id, phone: "+211 922 481 003", status: "ACTIVE" } }),
    prisma.agentProfile.upsert({ where: { userId: agentUsers[1].id }, update: {}, create: { userId: agentUsers[1].id, phone: "+211 955 102 778", status: "ACTIVE" } }),
    prisma.agentProfile.upsert({ where: { userId: agentUsers[2].id }, update: {}, create: { userId: agentUsers[2].id, phone: "+211 928 640 219", status: "INACTIVE" } }),
    prisma.agentProfile.upsert({ where: { userId: agentUsers[3].id }, update: {}, create: { userId: agentUsers[3].id, phone: "+211 911 305 884", status: "ACTIVE" } }),
  ]);

  console.log("  ✓ AgentProfiles");

  // ── 4. Events ───────────────────────────────────────────────────────────
  const eventDefs = [
    {
      title: "Juba Music Festival 2025",
      category: "Concert",
      poster: POSTERS.concert,
      image: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=600&q=80",
      organizer: "Nile Live Events",
      orgProfile: orgProfiles[0],
      date: new Date("2025-12-14T18:00:00Z"),
      time: "6:00 PM – 11:00 PM",
      venue: "Nyakuron Cultural Centre",
      city: "Juba",
      about: "The biggest night of live music in South Sudan returns to Nyakuron. Three stages, fifteen artists, and food vendors from across Juba. Gates open at 5:00 PM. No re-entry after 9:00 PM.",
      status: "ONGOING",
      featured: true,
      tiers: [
        { name: "VIP", price: 35, capacity: 400, remaining: 12, lowStock: true, soldOut: false },
        { name: "General", price: 14, capacity: 1400, remaining: 612, lowStock: false, soldOut: false },
        { name: "Student", price: 7, capacity: 200, remaining: 0, lowStock: false, soldOut: true },
      ],
      entryRate: [
        { time: "17:00", count: 40 }, { time: "17:30", count: 120 }, { time: "18:00", count: 286 },
        { time: "18:30", count: 341 }, { time: "19:00", count: 220 }, { time: "19:30", count: 130 },
        { time: "20:00", count: 74 }, { time: "20:30", count: 36 },
      ],
    },
    {
      title: "South Sudan Premier League Final",
      category: "Football",
      poster: POSTERS.football,
      image: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=600&q=80",
      organizer: "SSFA",
      orgProfile: orgProfiles[1],
      date: new Date("2025-12-22T16:00:00Z"),
      time: "4:00 PM kick-off",
      venue: "Juba National Stadium",
      city: "Juba",
      about: "The title decider. Defending champions face the league's top scorers in a sold-out showdown. Turnstiles open two hours before kick-off.",
      status: "UPCOMING",
      featured: false,
      tiers: [
        { name: "VIP Stand", price: 20, capacity: 600, remaining: 88, lowStock: false, soldOut: false },
        { name: "General Stand", price: 5, capacity: 8000, remaining: 2340, lowStock: false, soldOut: false },
      ],
      entryRate: [],
    },
    {
      title: "University of Juba Graduation 2025",
      category: "Graduation",
      poster: POSTERS.graduation,
      image: "https://images.unsplash.com/photo-1627556704302-624286467c65?w=600&q=80",
      organizer: "University of Juba",
      orgProfile: orgProfiles[2],
      date: new Date("2025-12-05T09:00:00Z"),
      time: "9:00 AM",
      venue: "Freedom Hall",
      city: "Juba",
      about: "The 2025 commencement ceremony for the graduating class. Each graduand is allocated guest tickets. Doors close promptly at 8:45 AM.",
      status: "COMPLETED",
      featured: false,
      tiers: [
        { name: "Family Guest", price: 4, capacity: 1200, remaining: 140, lowStock: false, soldOut: false },
      ],
      entryRate: [
        { time: "07:30", count: 60 }, { time: "08:00", count: 410 }, { time: "08:30", count: 520 },
        { time: "09:00", count: 180 }, { time: "09:30", count: 40 }, { time: "10:00", count: 12 },
      ],
    },
    {
      title: "Juba Tech & Innovation Summit",
      category: "Conference",
      poster: POSTERS.conference,
      image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80",
      organizer: "RwandanTechEvents",
      orgProfile: orgProfiles[3],
      date: new Date("2025-12-17T08:30:00Z"),
      time: "8:30 AM – 5:00 PM",
      venue: "Crown Hotel",
      city: "Juba",
      about: "A full-day gathering of founders, developers, and policymakers shaping South Sudan's digital economy. Includes lunch and a networking reception.",
      status: "UPCOMING",
      featured: false,
      tiers: [
        { name: "Delegate", price: 25, capacity: 300, remaining: 47, lowStock: false, soldOut: false },
        { name: "Student", price: 10, capacity: 100, remaining: 9, lowStock: true, soldOut: false },
      ],
      entryRate: [],
    },
    {
      title: "Juba Gospel Night",
      category: "Concert",
      poster: POSTERS.concert2,
      image: "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=600&q=80",
      organizer: "Grace Arena",
      orgProfile: orgProfiles[4],
      date: new Date("2025-12-28T17:00:00Z"),
      time: "5:00 PM",
      venue: "Dr. John Garang Mausoleum Grounds",
      city: "Juba",
      about: "An evening of worship and live gospel music under the Juba sky, featuring choirs from across the region.",
      status: "DRAFT",
      featured: false,
      tiers: [
        { name: "General", price: 5, capacity: 3000, remaining: 1820, lowStock: false, soldOut: false },
        { name: "VIP", price: 15, capacity: 250, remaining: 64, lowStock: false, soldOut: false },
      ],
      entryRate: [],
    },
  ];

  const events = [];
  for (const def of eventDefs) {
    const existing = await prisma.event.findFirst({ where: { title: def.title } });
    if (existing) {
      events.push(existing);
      continue;
    }
    const ev = await prisma.event.create({
      data: {
        title: def.title,
        category: def.category,
        poster: def.poster,
        image: def.image,
        organizer: def.organizer,
        orgProfileId: def.orgProfile.id,
        date: def.date,
        time: def.time,
        venue: def.venue,
        city: def.city,
        about: def.about,
        status: def.status,
        featured: def.featured,
        tiers: { create: def.tiers },
        entryRate: { create: def.entryRate },
      },
    });
    events.push(ev);
  }

  console.log("  ✓ Events + tiers + entry rate points");

  // ── 5. GateAgents ───────────────────────────────────────────────────────
  const jmfEvent = events[0]; // Juba Music Festival
  const pslEvent = events[1]; // SSPL Final

  const gateAgentDefs = [
    { name: "James Majok", phone: "+211 922 481 003", gate: "Gate A", status: "ACTIVE", event: jmfEvent, userId: agentUsers[0].id, lastActive: new Date(), scansToday: 412 },
    { name: "Rebecca Aluel", phone: "+211 955 102 778", gate: "Gate B", status: "ACTIVE", event: jmfEvent, userId: agentUsers[1].id, lastActive: new Date(), scansToday: 388 },
    { name: "Daniel Garang", phone: "+211 928 640 219", gate: "Gate C", status: "INACTIVE", event: jmfEvent, userId: agentUsers[2].id, lastActive: null, scansToday: 0 },
    { name: "Mary Nyibol", phone: "+211 911 305 884", gate: "Turnstile 2", status: "ACTIVE", event: pslEvent, userId: agentUsers[3].id, lastActive: new Date(), scansToday: 96 },
  ];

  const gateAgents = [];
  for (const ga of gateAgentDefs) {
    const existing = await prisma.gateAgent.findFirst({ where: { name: ga.name, eventId: ga.event.id } });
    if (existing) { gateAgents.push(existing); continue; }
    const created = await prisma.gateAgent.create({
      data: {
        eventId: ga.event.id,
        userId: ga.userId,
        name: ga.name,
        phone: ga.phone,
        gate: ga.gate,
        status: ga.status,
        lastActiveAt: ga.lastActive,
        scansToday: ga.scansToday,
      },
    });
    gateAgents.push(created);
  }

  console.log("  ✓ GateAgents");

  // ── 6. Bookings + Tickets (attendee wallet) ─────────────────────────────
  // Fetch tiers for JMF (VIP) and Tech (Delegate) and PSL (General Stand)
  const jmfTiers = await prisma.ticketTier.findMany({ where: { eventId: jmfEvent.id } });
  const techEvent = events[3];
  const techTiers = await prisma.ticketTier.findMany({ where: { eventId: techEvent.id } });
  const pslTiers = await prisma.ticketTier.findMany({ where: { eventId: pslEvent.id } });

  const jmfVip = jmfTiers.find((t) => t.name === "VIP");
  const techDelegate = techTiers.find((t) => t.name === "Delegate");
  const pslGeneral = pslTiers.find((t) => t.name === "General Stand");

  const bookingDefs = [
    {
      ref: "BKG-TIX7K2M",
      event: jmfEvent,
      tier: jmfVip,
      tierName: "VIP",
      method: "MTN",
      unitPrice: 35,
      ticketRef: "TIX-7K2M-9QX4",
      ticketStatus: "VALID",
      when: "upcoming",
    },
    {
      ref: "BKG-TIX4B8N",
      event: techEvent,
      tier: techDelegate,
      tierName: "Delegate",
      method: "AIRTEL",
      unitPrice: 25,
      ticketRef: "TIX-4B8N-2WP1",
      ticketStatus: "VALID",
      when: "upcoming",
    },
    {
      ref: "BKG-TIX1A5C",
      event: pslEvent,
      tier: pslGeneral,
      tierName: "General Stand",
      method: "MTN",
      unitPrice: 5,
      ticketRef: "TIX-1A5C-8RT6",
      ticketStatus: "USED",
      when: "past",
    },
  ];

  for (const bd of bookingDefs) {
    if (!bd.tier) continue;
    const existingTicket = await prisma.ticket.findUnique({ where: { ticketRef: bd.ticketRef } });
    if (existingTicket) continue;

    const subtotal = bd.unitPrice;
    const total = subtotal + 1;

    const booking = await prisma.booking.upsert({
      where: { ref: bd.ref },
      update: {},
      create: {
        ref: bd.ref,
        userId: attendee.id,
        eventId: bd.event.id,
        method: bd.method,
        subtotal,
        serviceFee: 1,
        total,
        status: "CONFIRMED",
        paidAt: new Date("2025-11-15T10:00:00Z"),
        lines: {
          create: {
            tierId: bd.tier.id,
            qty: 1,
            unitPrice: bd.unitPrice,
            subtotal,
          },
        },
      },
    });

    await prisma.ticket.create({
      data: {
        ticketRef: bd.ticketRef,
        tier: bd.tierName,
        status: bd.ticketStatus,
        qrPayload: `tiketi:${bd.ticketRef}:${bd.event.id}:${bd.tier.id}`,
        ownerId: attendee.id,
        eventId: bd.event.id,
        bookingId: booking.id,
        tierId: bd.tier.id,
        usedAt: bd.ticketStatus === "USED" ? new Date("2025-12-05T09:30:00Z") : null,
      },
    });
  }

  console.log("  ✓ Bookings + Tickets");

  // ── 7. Scan Records ─────────────────────────────────────────────────────
  const jmfGateA = gateAgents[0];
  const jmfGateB = gateAgents[1];
  const jmfGateC = gateAgents[2];

  const scanDefs = [
    { agent: jmfGateA, gate: "Gate A", result: "ADMIT", ticketRef: "TIX-7K2M-9QX4" },
    { agent: jmfGateB, gate: "Gate B", result: "ADMIT", ticketRef: "TIX-3P9L-1ZK8" },
    { agent: jmfGateA, gate: "Gate A", result: "INVALID", ticketRef: "TIX-2M4N-7TT0" },
    { agent: jmfGateA, gate: "Gate A", result: "ADMIT", ticketRef: "TIX-8W1C-4MM2" },
    { agent: jmfGateB, gate: "Gate B", result: "ADMIT", ticketRef: "TIX-5R6B-0QP5" },
    { agent: jmfGateC, gate: "Gate C", result: "INVALID", ticketRef: "TIX-1A5C-3RX9" },
    { agent: jmfGateA, gate: "Gate A", result: "ADMIT", ticketRef: "TIX-9X2D-8WB1" },
  ];

  const existingScanCount = await prisma.scanRecord.count({ where: { eventId: jmfEvent.id } });
  if (existingScanCount === 0) {
    for (const sd of scanDefs) {
      const ticket = await prisma.ticket.findUnique({ where: { ticketRef: sd.ticketRef } });
      await prisma.scanRecord.create({
        data: {
          eventId: jmfEvent.id,
          agentId: sd.agent.id,
          ticketId: ticket?.id ?? null,
          ticketRef: sd.ticketRef,
          gate: sd.gate,
          result: sd.result,
          note: sd.result === "INVALID" ? "Invalid signature" : null,
        },
      });
    }
  }

  console.log("  ✓ ScanRecords");

  // ── 8. SystemLogs ───────────────────────────────────────────────────────
  const existingLogCount = await prisma.systemLog.count();
  if (existingLogCount === 0) {
    await prisma.systemLog.createMany({
      data: [
        { service: "Airtel Money API", code: "ETIMEDOUT", message: "Callback timed out after 30s", resolved: false, occurredAt: new Date("2025-12-14T13:42:08Z") },
        { service: "Africa's Talking SMS", code: "429", message: "Rate limit exceeded, retried", resolved: true, resolvedAt: new Date("2025-12-14T11:25:00Z"), occurredAt: new Date("2025-12-14T11:20:51Z") },
        { service: "MTN Mobile Money API", code: "503", message: "Upstream temporarily unavailable", resolved: true, resolvedAt: new Date("2025-12-14T08:15:00Z"), occurredAt: new Date("2025-12-14T08:05:33Z") },
      ],
    });
  }

  console.log("  ✓ SystemLogs");
  console.log("\nSeed complete.");
  console.log("\nTest accounts:");
  console.log("  Admin     admin@tiketi.ss        / Admin@1234");
  console.log("  Organizer nile@tiketi.ss         / Organizer@1234");
  console.log("  Attendee  achol@tiketi.ss        / Attendee@1234");
  console.log("  Agent     james.majok@tiketi.ss  / Agent@1234");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
