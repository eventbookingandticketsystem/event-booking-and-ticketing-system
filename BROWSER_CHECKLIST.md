# Browser Verification Checklist

These items require a human browser pass — they cannot be driven headlessly
because they test the UI form behaviour, client-side navigation, and
visual rendering that scripts can't observe.

**Status:** Needs your eyes. All API paths beneath these flows are
proven by scripts; only the UI layer is unverified.

---

## 1. Login form — redirect by role

**Seed accounts:**

| Role       | Phone          | Password  |
|------------|----------------|-----------|
| Attendee   | +211912000002  | seed1234  |
| Organizer  | +211912000001  | seed1234  |
| Admin      | (see below)    |           |

> Admin seed: check `prisma/seed.ts` — the admin user has role ADMIN.
> If no admin seed exists, register an account then manually update
> `role` to `"ADMIN"` in MongoDB Atlas.

**Steps:**

1. Visit `/login`
2. PhoneInput should show **+211** (South Sudan) by default — no flag emoji, coloured box with "SS"
3. Log in as **attendee** (+211912000002 / seed1234)
   - Expect redirect → `/dashboard` (mobile shell, bottom nav visible)
   - Confirm the shell is max-width 390 px centered
4. Sign out (Account tab → Sign out)
5. Log in as **organizer** (+211912000001 / seed1234)
   - Expect redirect → `/organizer` (desktop sidebar, 4 stat cards)
   - Confirm the O1 dashboard loads real data (not zeros)
6. Sign out via sidebar

---

## 2. Book → Wallet round-trip (no page reload)

1. Log in as attendee (+211912000002 / seed1234)
2. Go to **Home** tab → tap any event card
3. On the event detail page, increment a ticket tier quantity
4. Tap **Book Tickets** → booking summary → confirm → payment screen
5. On the payment screen, tap **I've Paid** (or wait for auto-confirm)
6. Land on confirmation screen — note the booking reference
7. Tap **View My Tickets**
8. **Confirm the new ticket appears WITHOUT a page reload**
   - It should be in the Upcoming tab with status "Valid"
9. Tap the ticket card → QR code should render (real scannable QR, not placeholder)

---

## 3. AD2 Organizers — list + detail panel + tabs

1. Log in as admin
2. Go to `/admin/organizers`
3. **List:** confirm the organizers table shows real rows (name, phone, status)
4. Click any organizer row → detail panel should slide open inline (NOT navigate away)
5. **Overview tab:** organizer info (name, phone, orgName, joined date)
6. **Events tab:** table of their events — check real event titles + status pills
7. **Gate Agents tab:** table of their agents (or EmptyState if none)
8. **Activity tab:** EmptyState with "planned feature" message (intentionally empty)
9. Close panel — list should still be visible

---

## Known Incomplete by Design

These affordances are intentionally inert. Do not demo them as working
or treat them as bugs.

| Screen | Feature | Status |
|--------|---------|--------|
| AD2 Organizers | "Add organizer" modal | Validates inline only — no POST /api/admin/users endpoint exists. Shows "Invite sent" toast but makes no real API call. SMS invite is a planned feature. |
| AD5 System Health | All stat cards and service rows | Driven by `SYSTEM_HEALTH` mock data. No real infrastructure monitoring API. Info banner is shown. |
| AD6 Admin Settings | API key fields, config number fields, "Rotate JWT Key" modal | All static / inert. No backend endpoint for these settings. |
| O6 Reports | Stat cards (Gross Revenue, Tickets Sold, Avg Rating, etc.) | Driven by `REPORT` mock data. Warning banner shown. The event selector is real (loads your actual events) but the numbers are sample data. Real aggregation is planned. |
| O4 / AD2 / AD4 | Scan history modal | EmptyState shown — per-agent scan history endpoint not yet built. |
| G1 Gate Selector | "Start Scanning" → real API scan | The `useScan` mutation is wired. The "Scan QR" button cycles demo outcomes. The **"Real scan (test payload)"** button fires the actual POST /api/scan when agentId + eventId are in the URL. In production, the camera feed would decode QR codes automatically; no QR decoder library is integrated. |
| G8 Offline Sync | Sync counters ("38 scans recorded locally") | Demo values only — no local IndexedDB offline queue is implemented. |

---

## Seed Data in DB (do not delete)

| Phone          | Role       | Purpose                              |
|----------------|------------|--------------------------------------|
| +211912000001  | ORGANIZER  | Primary organizer for all org screens |
| +211912000002  | ATTENDEE   | Used in booking + ticket wallet tests |

Agent created during verification:
- Name: "Scan Test Agent" / "Verify Agent" — id: 6a3433773169858eee9f5d8a
- Assigned to: Juba Music Festival 2026 (6a33fa8d83957708f9f6d707)
- Gate: A
- scansToday: 2 (after two ADMIT scans in verification runs)
