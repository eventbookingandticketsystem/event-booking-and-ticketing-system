# <div align="center">🎟️ Tiketi — Event Booking and Ticketing System</div>

<div align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4-38BDF8?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS v4" />
  <img src="https://img.shields.io/badge/License-MIT-22c55e?style=for-the-badge" alt="MIT License" />
</div>

<br />

<div align="center">
  <em>A full-stack event booking and QR-code ticketing system built with Next.js 16 App Router — covering four user roles, offline-capable gate scanning, and mobile money payments.</em>
</div>

---

## 📑 Table of Contents

- [✨ Features](#-features)
- [🛠️ Tech Stack](#️-tech-stack)
- [📁 Project Structure](#-project-structure)
- [🗺️ Route Table](#️-route-table)
- [🚀 Getting Started](#-getting-started)
- [🧭 Demo Navigation](#-demo-navigation)
- [🔑 Key Implementation Notes](#-key-implementation-notes)
- [🎨 Design Tokens](#-design-tokens)
- [📄 License](#-license)

---

## ✨ Features

### 🌐 Public

- Landing page with animated hero QR-scan illustration (SVG)
- Explore page with combinable category and time-range filters
- Public event preview with ticket tier cards and live availability
- Share button that copies event URL to clipboard

### 👤 Attendee

- Mobile-first dashboard (responsive desktop sidebar on md+)
- Event discovery with keyword search and category filters
- Multi-tier ticket selection with per-tier quantity steppers
- Booking summary with inline quantity adjustment and service fee
- USSD mobile money payment screen with 5-minute countdown timer
- QR ticket wallet — real QR codes generated from ticket IDs via `qrcode`
- Upcoming / Past ticket tabs with empty states
- Account page with sign-out flow

### 🏢 Organizer

- Desktop sidebar dashboard with live admission stats and revenue
- Line chart (entry rate over time) and horizontal bar chart (tier breakdown)
- Recent scan table with per-row status pills
- 3-step event creation form with step indicator and per-step validation
- Events list with status filtering and quick-action buttons
- Gate agent management with Add Agent modal (phone input, duplicate check)
- Post-event report with charts and fraud attempt log
- Organizer settings page

### 🔐 Gate Agent

- Full-screen dark scanner shell — no navigation chrome
- Event download flow with animated progress bar (offline readiness)
- Demo QR scanner cycling 5 outcomes: ADMIT → ALREADY USED → INVALID → WRONG EVENT → EXPIRED
- Each result auto-resets after 2 seconds with a countdown
- Manual cash entry form for walk-in payments with tier mismatch warning
- Offline sync bottom sheet with simulated progress and connection restore

### 🛡️ Admin

- Platform overview: 4 stat cards + sales trend line chart + activity table
- Organizer management: searchable table, invite modal, suspend/delete confirm
- Organizer detail view with Events / Gate Agents / Activity Log tabs
- All-events table with fraud-flagged filter tab
- Gate agent oversight with scan history modal and deactivate confirmation
- System health dashboard with per-service status rows and degraded-service alert
- Settings: masked API credentials, configurable system limits, JWT rotation danger modal

---

## 🛠️ Tech Stack

| Category      | Technology                           |
| ------------- | ------------------------------------ |
| Framework     | Next.js 16.2.7 (App Router)          |
| Language      | TypeScript 5 (strict mode)           |
| Styling       | Tailwind CSS v4 (`@theme inline {}`) |
| UI Components | shadcn/ui + Radix UI                 |
| Forms         | React Hook Form 7 + Zod 4            |
| Icons         | Lucide React                         |
| QR Codes      | `qrcode` npm package                 |
| Charts        | Custom SVG (no third-party library)  |
| Data          | Static mock data — no backend        |
| Fonts         | Poppins · Inter · JetBrains Mono     |

---

## 📁 Project Structure

```
src/
├── app/
│   ├── globals.css              # Tailwind v4 @theme tokens + fonts
│   ├── layout.tsx               # Root HTML shell + metadata
│   ├── (home)/                  # Public: landing page + explore
│   │   ├── page.tsx             # Landing page (6 sections)
│   │   └── explore/
│   │       ├── page.tsx         # Event discovery grid
│   │       └── [id]/page.tsx    # Public event preview
│   ├── (auth)/                  # Auth screens (no shell)
│   │   ├── login/page.tsx       # AUTH1 — Sign in
│   │   ├── register/page.tsx    # AUTH2 — Register
│   │   └── forgot-password/     # AUTH3 — Forgot password
│   ├── (attendee)/              # Attendee mobile/desktop shell
│   │   ├── layout.tsx           # Mobile phone frame + desktop sidebar
│   │   └── dashboard/
│   │       ├── page.tsx         # A1 — Home / discovery
│   │       ├── event/[id]/      # A2 — Event detail + tier selector
│   │       ├── booking/[id]/    # A3 — Booking summary
│   │       ├── payment/[id]/    # A4 — USSD payment + countdown
│   │       ├── confirmation/    # A5 — Booking confirmed
│   │       ├── tickets/         # A6 — Ticket wallet
│   │       │   └── [id]/        # A7 — QR ticket view
│   │       └── account/         # A8 — Account
│   ├── (management)/            # Organizer desktop shell
│   │   ├── layout.tsx           # Navy sidebar + top bar
│   │   └── organizer/
│   │       ├── page.tsx         # O1 — Dashboard
│   │       ├── events/          # O2 — Events list
│   │       │   ├── create/      # O3 — Create event (3-step)
│   │       │   └── [id]/        # O4 — Event detail tabs
│   │       ├── gate-agents/     # O5 — Gate agent management
│   │       ├── reports/         # O6 — Post-event reports
│   │       └── settings/        # O7 — Organizer settings
│   ├── (validation)/            # Gate agent fullscreen shell
│   │   ├── layout.tsx           # w-screen h-screen, dark navy
│   │   └── agent/
│   │       ├── page.tsx         # G1 — Event selector + download
│   │       ├── scanner/         # G2 — QR scanner + result overlay
│   │       └── cash-entry/      # G9 — Manual cash entry
│   └── (system)/                # Admin desktop shell
│       ├── layout.tsx           # Admin sidebar + top bar
│       └── admin/
│           ├── page.tsx         # AD1 — Platform overview
│           ├── organizers/      # AD2 — Organizer management
│           │   └── [id]/        # AD2b — Organizer detail
│           ├── events/          # AD3 — Event oversight
│           ├── gate-agents/     # AD4 — Gate agent oversight
│           ├── health/          # AD5 — System health
│           └── settings/        # AD6 — Admin settings
│
├── components/
│   ├── Shared/                  # 18 reusable components
│   │   ├── Button.tsx           # Primary / ghost / danger variants
│   │   ├── StatusPill.tsx       # 24-value status badge system
│   │   ├── StatCard.tsx         # KPI card with icon chip + progress
│   │   ├── EventCard.tsx        # Attendee event list card
│   │   ├── ExploreCard.tsx      # 3:4 portrait poster card
│   │   ├── TicketCard.tsx       # Wallet card with QR placeholder
│   │   ├── TierSelector.tsx     # Ticket tier + quantity stepper
│   │   ├── EmptyState.tsx       # Icon + heading + subtext + CTA
│   │   ├── SkeletonCard.tsx     # Shimmer skeleton (matches loaded)
│   │   ├── AlertBanner.tsx      # success / danger / warning / info
│   │   ├── PhoneInput.tsx       # Country selector + numeric input
│   │   ├── NumberField.tsx      # Clamped numeric input
│   │   ├── FormField.tsx        # Label + input + inline error
│   │   ├── Modal.tsx            # Backdrop + dialog
│   │   ├── LineChart.tsx        # SVG line chart (no library)
│   │   ├── HBarChart.tsx        # SVG horizontal bar chart
│   │   └── Icon.tsx             # Lucide icon wrapper
│   ├── Home/                    # Landing + explore section components
│   │   ├── Navbar.tsx           # Sticky landing nav + mobile drawer
│   │   ├── HeroSection.tsx      # Hero copy + HeroArt SVG QR art
│   │   ├── HowItWorks.tsx       # 3-step cards
│   │   ├── Features.tsx         # 2x2 feature grid
│   │   ├── EventTypes.tsx       # 4 event-type cards
│   │   ├── CtaBand.tsx          # Navy CTA footer band
│   │   ├── Footer.tsx           # Site footer
│   │   └── ExploreFilters.tsx   # Category + time chips
│   ├── Auth/                    # Auth forms + brand panel
│   │   ├── AuthBrand.tsx        # Left panel: logo + feature list
│   │   ├── LoginForm.tsx        # Phone + password + show/hide
│   │   ├── RegisterForm.tsx     # Full name + phone + password strength
│   │   └── ForgotPasswordForm.tsx
│   ├── Attendee/                # Attendee shell components
│   │   ├── BottomNav.tsx        # 4-tab fixed bottom navigation
│   │   └── MobileTopBar.tsx     # Back + title + action bar
│   ├── Organizer/               # Organizer shell components
│   │   ├── OrgSidebar.tsx       # 220px navy sidebar
│   │   └── OrgTopbar.tsx        # 56px top bar with breadcrumb
│   └── Admin/                   # Admin shell components
│       ├── AdminSidebar.tsx     # Admin navy sidebar
│       └── AdminTopbar.tsx      # Admin top bar with role badge
│
├── lib/
│   ├── mock-data.ts             # All static data (events, tickets, users)
│   ├── utils.ts                 # cn(), formatSSP(), formatDate()
│   ├── qr-utils.ts              # generateTicketQR() via qrcode npm
│   └── created-events.ts        # In-memory list for O3 publish flow
│
├── types/                       # TypeScript interfaces
│   ├── event.ts                 # EventType, TicketTier, ExploreEventType
│   ├── ticket.ts                # TicketType
│   ├── user.ts                  # OrganizerType, GateAgentType
│   ├── booking.ts               # DashboardData, ReportData
│   └── scan.ts                  # ScanResult, SystemHealthData
│
├── constants/
│   ├── routes.ts                # All 32 route path constants
│   └── countries.ts             # PHONE_COUNTRIES array (12 countries)
│
└── validations/
    ├── auth.ts                  # loginSchema, registerSchema
    ├── event.ts                 # createEventSchema (3-step form)
    └── booking.ts               # bookingSchema
```

---

## 🗺️ Route Table

| Route                      | Role       | Screen                                   |
| -------------------------- | ---------- | ---------------------------------------- |
| `/`                        | Public     | Landing page — hero, features, CTA       |
| `/explore`                 | Public     | Event discovery with filters             |
| `/explore/[id]`            | Public     | Public event preview + tier list         |
| `/login`                   | Public     | AUTH1 — Sign in with phone + password    |
| `/register`                | Public     | AUTH2 — Register with role selection     |
| `/forgot-password`         | Public     | AUTH3 — Forgot password                  |
| `/dashboard`               | Attendee   | A1 — Home / event discovery              |
| `/dashboard/event/[id]`    | Attendee   | A2 — Event detail + tier selector        |
| `/dashboard/booking/[id]`  | Attendee   | A3 — Booking summary + payment method    |
| `/dashboard/payment/[id]`  | Attendee   | A4 — USSD payment + countdown timer      |
| `/dashboard/confirmation`  | Attendee   | A5 — Booking confirmed                   |
| `/dashboard/tickets`       | Attendee   | A6 — Ticket wallet (Upcoming / Past)     |
| `/dashboard/tickets/[id]`  | Attendee   | A7 — QR ticket view                      |
| `/dashboard/account`       | Attendee   | A8 — Account settings + sign out         |
| `/organizer`               | Organizer  | O1 — Live dashboard with charts          |
| `/organizer/events`        | Organizer  | O2 — Events list with status filters     |
| `/organizer/events/create` | Organizer  | O3 — 3-step event creation form          |
| `/organizer/events/[id]`   | Organizer  | O4 — Event detail with tabs              |
| `/organizer/gate-agents`   | Organizer  | O5 — Gate agent management               |
| `/organizer/reports`       | Organizer  | O6 — Post-event report + charts          |
| `/organizer/settings`      | Organizer  | O7 — Organizer settings                  |
| `/agent`                   | Gate Agent | G1 — Event selector + offline download   |
| `/agent/scanner`           | Gate Agent | G2 — QR scanner + 5-outcome demo cycle   |
| `/agent/cash-entry`        | Gate Agent | G9 — Manual cash entry form              |
| `/admin`                   | Admin      | AD1 — Platform overview + activity table |
| `/admin/organizers`        | Admin      | AD2 — Organizer list + invite modal      |
| `/admin/organizers/[id]`   | Admin      | AD2b — Organizer detail (tabbed)         |
| `/admin/events`            | Admin      | AD3 — All-events table + fraud filter    |
| `/admin/gate-agents`       | Admin      | AD4 — Gate agent oversight               |
| `/admin/health`            | Admin      | AD5 — System health + service status     |
| `/admin/settings`          | Admin      | AD6 — Credentials + JWT rotation         |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, or pnpm

### Installation

```bash
# 1. Clone the repository
git clone <repo-url>
cd event-booking-and-ticketing-system

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for production

```bash
npm run build
npm run start
```

> The production build compiles all 32 routes with zero server-side data fetching — all data is static mock data imported at build time.

---

## 🧭 Demo Navigation

No authentication is enforced — navigate directly to any role's entry point:

| Role       | URL          | Notes                                                |
| ---------- | ------------ | ---------------------------------------------------- |
| Attendee   | `/dashboard` | Mobile-first; responsive desktop sidebar on md+      |
| Organizer  | `/organizer` | Desktop shell; shows "use desktop" message on mobile |
| Gate Agent | `/agent`     | Fullscreen dark shell; no navigation chrome          |
| Admin      | `/admin`     | Desktop shell; same layout pattern as Organizer      |

### Attendee booking flow

```
/explore                      → browse events
/explore/[id]                 → public event preview
/dashboard                    → A1 home / discovery
/dashboard/event/[id]         → A2 select tiers
/dashboard/booking/[id]       → A3 confirm order + payment method
/dashboard/payment/[id]       → A4 USSD code + 5-min countdown
/dashboard/confirmation       → A5 booking confirmed
/dashboard/tickets            → A6 ticket wallet
/dashboard/tickets/[id]       → A7 QR ticket view
```

### Gate scanner demo

Visit `/agent`, select an event, and wait for the download progress bar to reach 100%. Tap **Start Scanning**, then tap **Scan QR** repeatedly to cycle through all five outcomes:

| #   | Result         | Overlay colour |
| --- | -------------- | -------------- |
| 1   | ADMIT          | Green          |
| 2   | ALREADY USED   | Red            |
| 3   | INVALID TICKET | Red            |
| 4   | WRONG EVENT    | Amber          |
| 5   | TICKET EXPIRED | Slate          |

Each result auto-resets after 2 seconds, or tap to dismiss immediately.

---

## 🔑 Key Implementation Notes

| Topic               | Detail                                                                    |
| ------------------- | ------------------------------------------------------------------------- |
| **Tailwind v4**     | Uses `@theme inline {}` in `globals.css` — no `tailwind.config.ts`        |
| **Zod v4**          | Uses `error:` field (not `required_error:`) for message overrides         |
| **No backend**      | All data imported from `src/lib/mock-data.ts` — no API calls              |
| **QR codes**        | Generated client-side with `qrcode` npm; navy `#08283B` on white          |
| **Charts**          | `LineChart` and `HBarChart` are hand-written SVG — no chart library       |
| **Booking session** | `sessionStorage` carries tier selection A2 -> A3 -> A4                    |
| **Gate scanner**    | 5-outcome cycle is index-based state; no real camera access needed        |
| **Offline sync**    | Simulated in-component state; no service worker wired up                  |
| **EntryRatePoint**  | Fields are `t` (label) and `v` (value) — not `time`/`count`               |
| **HBarChart prop**  | `data` (not `rows`)                                                       |
| **Modal prop**      | `description` (not `subtitle`)                                            |
| **StatusPill**      | 24-value union; `"Suspended"` is not in the union — cast if needed        |
| **Attendee layout** | `< md`: 390px phone frame + fixed bottom nav; `>= md`: full-width sidebar |
| **use client**      | Must be the absolute first line — before any import                       |
| **Dynamic params**  | All dynamic routes use `use(params)` pattern (Next.js 15+)                |
| **useSearchParams** | Always wrapped in `<Suspense>`                                            |

---

## 🎨 Design Tokens

Defined in `src/app/globals.css` via Tailwind v4 `@theme inline {}`:

### Colours

| Token            | Value     | Usage                                 |
| ---------------- | --------- | ------------------------------------- |
| `brand-orange`   | `#FF5A00` | Primary CTA, active states, scan beam |
| `brand-navy`     | `#08283B` | Sidebar backgrounds, QR dark modules  |
| `brand-dark`     | `#060F18` | Explore page background               |
| `status-success` | `#1A6B3C` | ADMIT overlay, confirmed pills        |
| `status-danger`  | `#A32D2D` | Error states, fraud flags, REJECTED   |
| `status-warning` | `#7A4A00` | Low stock, offline mode, WRONG EVENT  |
| `status-info`    | `#466177` | Info banners, upcoming pills          |
| `surface-bg`     | `#F7F6F2` | Page background                       |
| `border`         | `#E2E0D8` | Card and input borders                |
| `text-secondary` | `#5A6870` | Subtitles and labels                  |

### Typefaces

| Family         | Class          | Used for                             |
| -------------- | -------------- | ------------------------------------ |
| Poppins        | `font-display` | Headings, stat values, nav labels    |
| Inter          | `font-body`    | Body copy, buttons, form labels      |
| JetBrains Mono | `font-mono`    | Ticket IDs, USSD codes, booking refs |

---

<div align="center">
  <p>
    Built by <a href="https://github.com/eventbookingandticketsystem">Narmin Stanley Atoroba</a>
    &nbsp;&middot;&nbsp;
    <a href="https://wa.me/211929468146">Contact</a>
  </p>
  <a href="#-tiketi--event-booking-and-ticketing-system">
    <img src="https://img.shields.io/badge/%E2%86%91-Back_to_Top-08283B?style=flat-square" alt="Back to top" />
  </a>
</div>
