/**
 * Real NextAuth credentials login test using a cookie jar.
 * Fixes the CSRF failure: GET /csrf first to capture BOTH the token AND the cookie,
 * then send both on the POST.
 */
const BASE = "http://localhost:3000";

const PASS = (msg) => console.log(`  ✅ ${msg}`);
const FAIL = (msg) => { console.error(`  ❌ ${msg}`); process.exitCode = 1; };
const INFO = (msg) => console.log(`  🔍 ${msg}`);

async function tryLogin(label, phone, password, expectedRole, dashPath) {
  console.log(`\n${"─".repeat(60)}`);
  console.log(`${label}: ${phone}`);
  console.log(`${"─".repeat(60)}`);

  // ── Step 1: GET /api/auth/csrf ──────────────────────────────────────────────
  const csrfRes = await fetch(`${BASE}/api/auth/csrf`);
  const csrfBody = await csrfRes.json();
  const csrfToken = csrfBody.csrfToken;

  // Extract CSRF cookie from Set-Cookie header
  const setCookieHeader = csrfRes.headers.get("set-cookie") ?? "";
  const csrfCookiePart = setCookieHeader.split(",").find(c => c.trim().startsWith("next-auth.csrf-token"));
  // Value is the part before the first semicolon
  const csrfCookieValue = csrfCookiePart ? csrfCookiePart.trim().split(";")[0] : "";

  INFO(`csrfToken: ${csrfToken?.slice(0, 20)}...`);
  INFO(`csrf cookie: ${csrfCookieValue?.slice(0, 40)}...`);

  if (!csrfToken) { FAIL("No csrfToken in response"); return null; }
  if (!csrfCookieValue) { FAIL("No csrf cookie in Set-Cookie"); return null; }

  // ── Step 2: POST /api/auth/callback/credentials ─────────────────────────────
  const body = new URLSearchParams({
    csrfToken: csrfToken,
    username:  phone,
    password:  password,
    redirect:  "false",
    callbackUrl: `${BASE}/`,
    json: "true",
  });

  const loginRes = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "Content-Type":  "application/x-www-form-urlencoded",
      "Cookie":        csrfCookieValue,
    },
    body: body.toString(),
    redirect: "manual",
  });

  INFO(`Login response status: ${loginRes.status}`);
  INFO(`Login response type: ${loginRes.type}`);

  // Log all response headers
  const respHeaders = {};
  loginRes.headers.forEach((v, k) => { respHeaders[k] = v; });
  INFO(`Response headers: ${JSON.stringify(respHeaders, null, 2)}`);

  let loginBody = "";
  try { loginBody = await loginRes.text(); } catch {}
  INFO(`Response body: ${loginBody.slice(0, 300)}`);

  // ── Step 3: Extract session cookie ─────────────────────────────────────────
  const loginSetCookie = loginRes.headers.get("set-cookie") ?? "";
  INFO(`Set-Cookie on login: ${loginSetCookie.slice(0, 200)}`);

  // Look for session token in redirect location or set-cookie
  const location = loginRes.headers.get("location") ?? "";
  INFO(`Location: ${location}`);

  // Check if it's a CSRF rejection
  if (location.includes("csrf=true") || loginBody.includes("csrf=true")) {
    FAIL("CSRF rejection — cookie jar approach still failing");
    INFO(`Full body: ${loginBody}`);
    return null;
  }

  // Parse out session token cookie
  const sessionCookiePart = loginSetCookie.split(",")
    .find(c => c.trim().startsWith("next-auth.session-token"));
  const sessionCookie = sessionCookiePart
    ? sessionCookiePart.trim().split(";")[0]
    : "";

  if (!sessionCookie) {
    // Maybe it's in the callback URL — try following the redirect
    INFO("No session cookie in direct response, trying to follow redirect...");
    if (location) {
      const followRes = await fetch(location, {
        headers: { "Cookie": csrfCookieValue },
        redirect: "manual",
      });
      INFO(`Follow redirect status: ${followRes.status}`);
      const followCookie = followRes.headers.get("set-cookie") ?? "";
      INFO(`Follow Set-Cookie: ${followCookie.slice(0, 200)}`);
    }
    FAIL("No next-auth.session-token in response");
    return null;
  }

  PASS(`Session cookie found: ${sessionCookie.slice(0, 40)}...`);

  // ── Step 4: GET /api/auth/session ──────────────────────────────────────────
  const sessionRes = await fetch(`${BASE}/api/auth/session`, {
    headers: { "Cookie": sessionCookie },
  });
  const sessionBody = await sessionRes.json();
  INFO(`Session response: ${JSON.stringify(sessionBody)}`);

  if (!sessionBody.user) {
    FAIL("Session response has no user");
    return null;
  }
  PASS(`Session user: ${JSON.stringify(sessionBody.user)}`);
  sessionBody.user.role === expectedRole
    ? PASS(`Role correct: "${sessionBody.user.role}"`)
    : FAIL(`Role wrong: expected "${expectedRole}", got "${sessionBody.user.role}"`);

  // ── Step 5: Access an authed page ──────────────────────────────────────────
  const pageRes = await fetch(`${BASE}${dashPath}`, {
    headers: { "Cookie": sessionCookie },
    redirect: "manual",
  });
  INFO(`GET ${dashPath} status: ${pageRes.status}`);
  pageRes.status === 200 || pageRes.status === 307
    ? PASS(`Authed page GET ${dashPath} → ${pageRes.status}`)
    : FAIL(`Authed page returned unexpected status ${pageRes.status}`);

  return sessionCookie;
}

// ── Run for organizer ────────────────────────────────────────────────────────
const orgCookie = await tryLogin(
  "ORGANIZER LOGIN",
  "+211912000001",
  "seed1234",
  "ORGANIZER",
  "/organizer",
);

// ── Run for attendee ────────────────────────────────────────────────────────
const attCookie = await tryLogin(
  "ATTENDEE LOGIN",
  "+211912000002",
  "seed1234",
  "ATTENDEE",
  "/dashboard",
);

console.log("\n" + "═".repeat(60));
if (process.exitCode === 1) {
  console.error("❌ REAL LOGIN: FAIL\n");
  console.log("Manual test checklist will be needed.");
} else {
  console.log("✅ REAL LOGIN: PASS — headless credentials login works.\n");
  console.log("OBSERVED:");
  if (orgCookie) console.log("  • Organizer: real session cookie, role=ORGANIZER confirmed");
  if (attCookie) console.log("  • Attendee:  real session cookie, role=ATTENDEE confirmed");
}
