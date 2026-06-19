const base = "http://localhost:3001";

async function login(phone, password) {
  const csrf = await fetch(`${base}/api/auth/csrf`);
  const { csrfToken } = await csrf.json();
  const csrfCk = (csrf.headers.get("set-cookie") ?? "").split(";")[0];
  const res = await fetch(`${base}/api/auth/callback/credentials`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Cookie: csrfCk },
    body: new URLSearchParams({
      csrfToken, phone, password, redirect: "false", callbackUrl: base, json: "true",
    }).toString(),
    redirect: "manual",
  });
  const token = (res.headers.get("set-cookie") ?? "").match(/next-auth\.session-token=([^;]+)/)?.[1];
  return token ? `next-auth.session-token=${token}` : null;
}

// 1. Login
const orgCookie = await login("+211912000001", "seed1234");
const attCookie = await login("+211912000002", "seed1234");
console.log("Organizer login:", orgCookie ? "OK" : "FAILED");
console.log("Attendee login: ", attCookie  ? "OK" : "FAILED");

// 2. Book a fresh ticket
const eventId = "6a33fa8d83957708f9f6d707";
const evRes = await fetch(`${base}/api/events/${eventId}`, { headers: { Cookie: attCookie } });
const ev = (await evRes.json()).data;
const tierId = ev.tiers[0]?.id;
console.log("\nTier:", ev.tiers[0]?.name, "id:", tierId);

const bookRes = await fetch(`${base}/api/bookings`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Cookie: attCookie },
  body: JSON.stringify({ eventId, lines: [{ tierId, qty: 1 }], method: "MTN" }),
});
const book = (await bookRes.json()).data;
console.log("Booking status:", bookRes.status, "ref:", book?.ref);
const freshTicketRef = book?.tickets?.[0]?.ticketRef;

// 3. Get qrPayload from wallet
const walletRes = await fetch(`${base}/api/tickets`, { headers: { Cookie: attCookie } });
const walletTickets = (await walletRes.json()).data ?? [];
const fresh = walletTickets.find(t => t.ticketRef === freshTicketRef);
const fullQr = fresh?.qrPayload;
console.log("Ticket:", fresh?.ticketRef, "status:", fresh?.status, "qrPayload:", fullQr);

if (!fullQr) { console.error("No qrPayload — aborting"); process.exit(1); }

// 4. Get/create agent
const agentsRes = await fetch(`${base}/api/agents?eventId=${eventId}`, { headers: { Cookie: orgCookie } });
const agents = (await agentsRes.json()).data ?? [];
let agentId = agents[0]?.id;
if (!agentId) {
  const cr = await fetch(`${base}/api/agents`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: orgCookie },
    body: JSON.stringify({ name: "Verify Agent", phone: "+211922799001", gate: "Main", eventId }),
  });
  agentId = (await cr.json()).data?.id;
}
console.log("\nAgent id:", agentId);

// 5. Scan: ADMIT
const s1 = await fetch(`${base}/api/scan`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Cookie: orgCookie },
  body: JSON.stringify({ qrPayload: fullQr, eventId, gate: "Main", agentId }),
});
const b1 = (await s1.json()).data;
console.log("\nSCAN 1 ADMIT →", b1.result, "| attendee:", b1.attendee, "| tier:", b1.tier);

// 6. Scan: ALREADY_USED
const s2 = await fetch(`${base}/api/scan`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Cookie: orgCookie },
  body: JSON.stringify({ qrPayload: fullQr, eventId, gate: "Main", agentId }),
});
const b2 = (await s2.json()).data;
console.log("SCAN 2 ALREADY_USED →", b2.result, "| usedAt:", b2.usedAt);

// 7. Scan: INVALID
const s3 = await fetch(`${base}/api/scan`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Cookie: orgCookie },
  body: JSON.stringify({ qrPayload: "garbage-xyz", eventId, gate: "Main", agentId }),
});
const b3 = (await s3.json()).data;
console.log("SCAN 3 INVALID →", b3.result, "|", b3.message);

// 8. Scan: WRONG_EVENT
const wrongEvent = "6a33fa8e83957708f9f6d70a";
const s4 = await fetch(`${base}/api/scan`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Cookie: orgCookie },
  body: JSON.stringify({ qrPayload: fullQr, eventId: wrongEvent, gate: "Main", agentId }),
});
const b4 = (await s4.json()).data;
console.log("SCAN 4 WRONG_EVENT →", b4.result, "|", b4.message);

// 9. Confirm ticket USED
const chk = await fetch(`${base}/api/tickets`, { headers: { Cookie: attCookie } });
const chkTickets = (await chk.json()).data ?? [];
const t = chkTickets.find(x => x.ticketRef === freshTicketRef);
console.log("\nPost-scan ticket status:", t?.status, "(expected: USED)");

// 10. Confirm scansToday: ADMIT +1, ALREADY_USED no increment
const agR = await fetch(`${base}/api/agents?eventId=${eventId}`, { headers: { Cookie: orgCookie } });
const agData = (await agR.json()).data ?? [];
const agent = agData.find(a => a.id === agentId);
const prevScans = agents.find(a => a.id === agentId)?.scansToday ?? 0;
console.log("Agent scansToday:", agent?.scansToday, "(was", prevScans, "before → should be", prevScans + 1, ")");
console.log("scansToday increment correct:", agent?.scansToday === prevScans + 1 ? "YES" : "NO");
