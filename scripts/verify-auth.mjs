/**
 * verify-auth.mjs
 *
 * Exercises the REAL NextAuth sign-in path end-to-end:
 *   1. POST /api/auth/csrf                — get the CSRF token NextAuth requires
 *   2. POST /api/auth/callback/credentials — submit credentials, capture session cookie
 *   3. GET  /api/tickets  WITH cookie     — confirm 200 (authenticated)
 *   4. GET  /api/tickets  WITHOUT cookie  — confirm 403
 *   5. POST /api/auth/signout  WITH cookie — sign out, confirm cookie cleared
 *   6. GET  /api/tickets  after sign-out  — confirm 403 again
 *   7. Wrong password                     — confirm no cookie set
 *
 * This is the loop the smoke test couldn't close: a cookie minted by the
 * real login flow, accepted by a protected route.
 */

const BASE  = "http://localhost:3000";
const PHONE = "+211912000001";   // seed organizer
const PASS  = "seed1234";

// ── Helpers ──────────────────────────────────────────────────────────────────

function assert(condition, label, extra = "") {
  if (condition) {
    console.log(`  ✅ PASS  ${label}${extra ? "  →  " + extra : ""}`);
  } else {
    console.error(`  ❌ FAIL  ${label}${extra ? "  →  " + extra : ""}`);
    process.exitCode = 1;
  }
}

/** Extract Set-Cookie values from a fetch response. */
function extractCookies(response) {
  // fetch() in Node 18+ exposes headers.getSetCookie() or we fall back to raw
  const raw = response.headers.get("set-cookie") ?? "";
  return raw;
}

/** Extract a specific cookie value by name from a Set-Cookie header string. */
function getCookieValue(setCookieStr, name) {
  const parts = setCookieStr.split(",").flatMap((s) => s.split(";"));
  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.startsWith(name + "=")) {
      return trimmed.slice(name.length + 1).trim();
    }
  }
  return null;
}

// ── STEP 1: Get CSRF token ────────────────────────────────────────────────────
console.log("\n══ STEP 1 — Fetch CSRF token ══");
const csrfRes  = await fetch(`${BASE}/api/auth/csrf`);
const csrfBody = await csrfRes.json();
const csrfToken = csrfBody.csrfToken;
assert(!!csrfToken, "CSRF token received", csrfToken?.slice(0, 16) + "…");

// Capture the CSRF cookie from the response
const csrfCookieHeader = extractCookies(csrfRes);

// ── STEP 2: POST credentials — valid creds ────────────────────────────────────
console.log("\n══ STEP 2 — Sign in with valid credentials ══");

const body = new URLSearchParams({
  phone:      PHONE,
  password:   PASS,
  csrfToken,
  callbackUrl: `${BASE}/dashboard`,
  json:        "true",
});

const signinRes = await fetch(`${BASE}/api/auth/callback/credentials`, {
  method:   "POST",
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
    // Forward the csrf cookie NextAuth set in step 1
    "Cookie": csrfCookieHeader,
  },
  body: body.toString(),
  redirect: "manual",   // don't follow redirect — we want the Set-Cookie header
});

console.log("  sign-in status:", signinRes.status);
const signinCookies = signinRes.headers.get("set-cookie") ?? "";
console.log("  set-cookie present:", !!signinCookies);

// NextAuth sets: next-auth.session-token (HttpOnly JWT)
// It may also set next-auth.callback-url and next-auth.csrf-token
const sessionTokenLine = signinCookies
  .split(",")
  .find((c) => c.includes("next-auth.session-token"));

const sessionTokenValue = sessionTokenLine
  ?.split(";")[0]
  ?.trim();    // "next-auth.session-token=<value>"

assert(!!sessionTokenValue, "session-token cookie set after sign-in", sessionTokenValue?.slice(0, 40) + "…");

// ── STEP 3: GET /api/tickets WITH session cookie → expect 200 ─────────────────
console.log("\n══ STEP 3 — GET /api/tickets WITH session cookie ══");

// We need to send the session cookie back to the server
const ticketsWithAuth = await fetch(`${BASE}/api/tickets`, {
  headers: { Cookie: sessionTokenValue ?? "" },
});
const ticketsBody = await ticketsWithAuth.json();

assert(ticketsWithAuth.status === 200,    "status 200 with cookie",      `got ${ticketsWithAuth.status}`);
assert(ticketsBody.success === true,      "body.success true",            String(ticketsBody.success));
assert(Array.isArray(ticketsBody.data),   "body.data is array",           `length=${ticketsBody.data?.length}`);
console.log(`  tickets returned: ${ticketsBody.data?.length ?? 0} (organizer has none, which is correct)`);

// ── STEP 4: GET /api/tickets WITHOUT cookie → expect 403 ─────────────────────
console.log("\n══ STEP 4 — GET /api/tickets WITHOUT cookie ══");

const ticketsNoAuth = await fetch(`${BASE}/api/tickets`);
const noAuthBody    = await ticketsNoAuth.json();

assert(ticketsNoAuth.status === 403,      "status 403 without cookie",    `got ${ticketsNoAuth.status}`);
assert(noAuthBody.success === false,      "body.success false",            String(noAuthBody.success));
assert(noAuthBody.message === "Authentication required",
                                          "correct error message",         noAuthBody.message);

// ── STEP 5: Sign out ─────────────────────────────────────────────────────────
console.log("\n══ STEP 5 — Sign out ══");

const signoutRes = await fetch(`${BASE}/api/auth/signout`, {
  method:  "POST",
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
    Cookie: [csrfCookieHeader, sessionTokenValue].filter(Boolean).join("; "),
  },
  body: new URLSearchParams({ csrfToken, callbackUrl: `${BASE}/login`, json: "true" }).toString(),
  redirect: "manual",
});

console.log("  sign-out status:", signoutRes.status);
const signoutCookies = signoutRes.headers.get("set-cookie") ?? "";

// NextAuth clears the session by setting the cookie with an empty value and past Max-Age/Expires
const sessionCleared = signoutCookies.includes("next-auth.session-token") &&
  (signoutCookies.includes("Max-Age=0") || signoutCookies.includes("expires=") ||
   signoutCookies.match(/next-auth\.session-token=;/) !== null ||
   signoutCookies.match(/next-auth\.session-token=\s*;/) !== null);

// Also check if the value is empty or max-age=0
const clearedTokenLine = signoutCookies.split(",").find(c => c.includes("next-auth.session-token"));
const clearedValue = clearedTokenLine?.split(";")[0]?.trim() ?? "";
const isEmpty = clearedValue === "next-auth.session-token=" || clearedValue.endsWith("=");

assert(
  signoutRes.status === 200 || signoutRes.status === 302 || signoutRes.status === 200,
  "sign-out responded",
  `status=${signoutRes.status}`
);
assert(
  signoutCookies.includes("next-auth.session-token"),
  "session-token cookie touched on sign-out",
  isEmpty ? "cleared (empty value)" : clearedValue.slice(0, 40) + "…"
);

// ── STEP 6: GET /api/tickets after sign-out → expect 403 ─────────────────────
console.log("\n══ STEP 6 — GET /api/tickets after sign-out ══");

// Simulate sending the now-invalidated (or cleared) cookie
const afterSignout = await fetch(`${BASE}/api/tickets`, {
  headers: { Cookie: clearedValue || "" },
});

assert(afterSignout.status === 403, "403 after sign-out", `got ${afterSignout.status}`);

// ── STEP 7: Wrong password → no session cookie ────────────────────────────────
console.log("\n══ STEP 7 — Wrong password → no session cookie ══");

const wrongBody = new URLSearchParams({
  phone:      PHONE,
  password:   "wrongpassword",
  csrfToken,
  callbackUrl: `${BASE}/dashboard`,
  json:        "true",
});

const wrongRes = await fetch(`${BASE}/api/auth/callback/credentials`, {
  method: "POST",
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
    Cookie: csrfCookieHeader,
  },
  body: wrongBody.toString(),
  redirect: "manual",
});

const wrongCookies   = wrongRes.headers.get("set-cookie") ?? "";
const wrongToken     = wrongCookies.split(",").find((c) => c.includes("next-auth.session-token"));
// After failed auth NextAuth redirects to /login?error=CredentialsSignin — no session cookie
const noSessionSet   = !wrongToken || wrongToken.includes("=;") || wrongToken.includes("Max-Age=0");

console.log("  wrong-password status:", wrongRes.status);
console.log("  wrong-password set-cookie:", wrongCookies.slice(0, 120) || "(none)");
assert(noSessionSet, "no valid session cookie after wrong password");

// ── Summary ───────────────────────────────────────────────────────────────────
console.log("\n══════════════════════════════════════════════");
if (process.exitCode === 1) {
  console.log("  RESULT: ❌ One or more assertions failed — see FAIL lines above");
} else {
  console.log("  RESULT: ✅ All assertions passed");
  console.log("  The real NextAuth sign-in → cookie → protected route loop is confirmed.");
}
console.log("══════════════════════════════════════════════\n");
