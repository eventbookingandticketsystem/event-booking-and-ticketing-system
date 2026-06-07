# READ THIS ENTIRE FILE BEFORE WRITING A SINGLE LINE OF CODE.

# This file is the source of truth for all implementation decisions.

---

## 1. YOUR PRIMARY INSTRUCTION

You are implementing a production Next.js application from an
approved design prototype. The prototype lives in:

```
design-reference/event-booking-and-ticketing-system-with-qr-code-validation/project/
```

**Before writing any code**, read these files in this order:

```
1. design-reference/.../project/index.html          ← entry point, all scripts
2. design-reference/.../project/tokens.css          ← every color, font, spacing token
3. design-reference/.../project/styles.css          ← every component style
4. design-reference/.../project/js/data.jsx         ← all mock data (copy verbatim)
5. design-reference/.../project/js/primitives.jsx   ← Button, FormField, PhoneInput, etc.
6. design-reference/.../project/js/components.jsx   ← EventCard, TicketCard, TierSelector, charts
7. design-reference/.../project/js/app.jsx          ← routing, role shells, screen names
8. design-reference/.../project/js/auth.jsx         ← AUTH1, AUTH2, AUTH3 screens
9. design-reference/.../project/js/landing.jsx      ← Landing page + HeroArt SVG
10. design-reference/.../project/js/explore.jsx     ← Explore + PublicEventPreview
11. design-reference/.../project/js/attendee.jsx    ← A1–A8 screens
12. design-reference/.../project/js/gate.jsx        ← G1–G9 screens
13. design-reference/.../project/js/organizer.jsx   ← O1 Dashboard + shell
14. design-reference/.../project/js/organizer2.jsx  ← O2–O7 screens
15. design-reference/.../project/js/admin.jsx       ← AD1–AD6 screens
```

**Implementation rule**: Match the visual output of the prototype
pixel-perfectly. Do not copy the prototype's internal JSX structure —
rewrite it in idiomatic Next.js/TypeScript/Tailwind. Match what it
_looks like_, not how it was coded.

---

## 2. PROJECT IDENTITY

- **Name:** Tiketi
- **Tagline:** Event booking & ticketing for South Sudan
- **Stack:** Next.js 15 App Router · TypeScript strict · Tailwind CSS ·
  shadcn/ui · React Hook Form + Zod · Lucide React · qrcode npm
- **Data:** Static mock data only — no backend, no API calls, no database
- **Context:** South Sudan (Juba) — SSP currency, +211 phones,
  MTN Mobile Money + Airtel Money, Juba venues

---

## 3. NEXT.JS 15 — CRITICAL RULES

### Use App Router only

```
✅ src/app/               CORRECT
❌ src/pages/             NEVER — pages router is forbidden
```

### Route group structure — use exactly this

```
src/app/
  (home)/            Landing page + Explore (public)
  (auth)/            Sign in, Register, Forgot password
  (attendee)/        Attendee mobile shell + A1–A8
  (management)/      Organizer desktop shell + O1–O7
  (validation)/      Gate agent fullscreen shell + G1, G2, G9
  (system)/          Admin desktop shell + AD1–AD6
```

### Server vs Client components

```
✅ Default: every file is a Server Component
✅ Add 'use client' ONLY when the component uses:
   - useState / useReducer / useEffect / useRef
   - onClick / onChange / any browser event handler
   - useRouter / usePathname / useSearchParams
   - Browser APIs (window, navigator, localStorage)

✅ 'use client' must be the FIRST LINE of the file — before imports
❌ Never add 'use client' to layout.tsx files unless required
❌ Never add 'use client' to page.tsx files that only render static content
```

### Navigation — always next/navigation, never next/router

```typescript
✅ import { useRouter, usePathname, useSearchParams } from 'next/navigation'
✅ import Link from 'next/link'
✅ <Link href="/explore">Explore</Link>

❌ import { useRouter } from 'next/router'       // pages router — forbidden
❌ <Link href="..."><a href="...">...</a></Link>  // old pattern — forbidden
```

### Data fetching

```typescript
✅ import { EVENTS, USERS } from '@/lib/mock-data'  // direct import
✅ async/await in Server Components is fine

❌ getServerSideProps    // forbidden
❌ getStaticProps        // forbidden
❌ getInitialProps       // forbidden
❌ fetch('/api/...')     // do not call your own routes
```

### Metadata

```typescript
// In layout.tsx or page.tsx (Server Components only):
✅ export const metadata: Metadata = { title: 'Tiketi', description: '...' }
✅ export function generateMetadata({ params }) { return { title: params.id } }

❌ <Head><title>...</title></Head>   // pages router pattern — forbidden
```

### Loading and error files

```
Every route folder MUST have:
  loading.tsx   → renders skeleton (use SkeletonCard components)
  error.tsx     → 'use client', renders AlertBanner danger + retry button
```

---

## 4. DESIGN TOKENS — copy exactly from prototype

Read `design-reference/.../project/tokens.css` for the full token set.
Map them to Tailwind in `tailwind.config.ts`:

```typescript
// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Brand (from --orange and --navy in tokens.css)
        brand: {
          orange: "#FF5A00",
          "orange-hover": "#E85100",
          "orange-press": "#CC4800",
          "orange-deep": "#A83900",
          navy: "#08283B",
          "navy-2": "#0F3349",
          dark: "#060F18", // explore page bg
        },
        // Semantic status (from tokens.css)
        status: {
          success: "#1A6B3C",
          "success-bg": "#EAF3DE",
          danger: "#A32D2D",
          "danger-bg": "#FCEBEB",
          warning: "#7A4A00",
          "warning-bg": "#FDF0D5",
          info: "#466177",
          "info-bg": "#CAE6FF",
        },
        // Neutrals (from tokens.css)
        surface: {
          bg: "#F7F6F2",
          DEFAULT: "#FFFFFF",
          alt: "#FFF8F6",
        },
        border: {
          DEFAULT: "#E2E0D8",
        },
        text: {
          DEFAULT: "#0F1A20",
          secondary: "#5A6870",
          muted: "#6B7280",
        },
      },
      fontFamily: {
        display: ["Poppins", "Helvetica Neue", "Arial", "sans-serif"],
        body: ["Inter", "system-ui", "sans-serif"],
        mono: [
          "JetBrains Mono",
          "ui-monospace",
          "SF Mono",
          "Menlo",
          "monospace",
        ],
      },
      borderRadius: {
        sm: "2px",
        md: "6px",
        lg: "8px",
        pill: "9999px",
      },
      boxShadow: {
        card: "0px 1px 2px 0px rgba(0,0,0,0.05)",
        stat: "0px 2px 4px 0px rgba(0,0,0,0.02)",
        pop: "0px 8px 24px -6px rgba(8,40,59,0.18)",
      },
    },
  },
};
export default config;
```

Add to `src/app/globals.css`:

```css
@import url("https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap");

@tailwind base;
@tailwind components;
@tailwind utilities;
```

---

## 5. FULL PROJECT STRUCTURE

```
src/
├── app/
│   ├── layout.tsx                        # Root layout, fonts
│   ├── globals.css
│   ├── (home)/
│   │   ├── page.tsx                      # Landing page
│   │   └── explore/
│   │       ├── page.tsx                  # Public event discovery
│   │       ├── loading.tsx
│   │       └── [id]/
│   │           ├── page.tsx              # Public event preview
│   │           └── loading.tsx
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx                  # AUTH1 Sign in
│   │   ├── register/
│   │   │   └── page.tsx                  # AUTH2 Register
│   │   └── forgot-password/
│   │       └── page.tsx                  # AUTH3 Forgot password
│   ├── (attendee)/
│   │   ├── layout.tsx                    # Mobile shell + bottom nav
│   │   └── dashboard/
│   │       ├── page.tsx                  # A1 Home/Discovery
│   │       ├── loading.tsx
│   │       ├── event/[id]/
│   │       │   ├── page.tsx              # A2 Event detail
│   │       │   └── loading.tsx
│   │       ├── booking/[id]/
│   │       │   └── page.tsx              # A3 Booking summary
│   │       ├── payment/[id]/
│   │       │   └── page.tsx              # A4 Payment / USSD
│   │       ├── confirmation/
│   │       │   └── page.tsx              # A5 Booking confirmation
│   │       ├── tickets/
│   │       │   ├── page.tsx              # A6 Ticket wallet
│   │       │   ├── loading.tsx
│   │       │   └── [id]/
│   │       │       └── page.tsx          # A7 QR ticket view
│   │       └── account/
│   │           └── page.tsx              # A8 Account
│   ├── (management)/
│   │   ├── layout.tsx                    # Desktop sidebar shell
│   │   └── organizer/
│   │       ├── page.tsx                  # O1 Dashboard
│   │       ├── loading.tsx
│   │       ├── events/
│   │       │   ├── page.tsx              # O2 My Events
│   │       │   ├── loading.tsx
│   │       │   ├── create/
│   │       │   │   └── page.tsx          # O3 Create Event (3-step)
│   │       │   └── [id]/
│   │       │       └── page.tsx          # O4 Event detail (tabs)
│   │       ├── gate-agents/
│   │       │   └── page.tsx              # O5 Gate Agents
│   │       ├── reports/
│   │       │   └── page.tsx              # O6 Reports
│   │       └── settings/
│   │           └── page.tsx              # O7 Settings
│   ├── (validation)/
│   │   ├── layout.tsx                    # Fullscreen shell, no nav
│   │   └── agent/
│   │       ├── page.tsx                  # G1 Event selector
│   │       ├── scanner/
│   │       │   └── page.tsx              # G2 QR Scanner
│   │       └── cash-entry/
│   │           └── page.tsx              # G9 Manual cash entry
│   └── (system)/
│       ├── layout.tsx                    # Admin desktop sidebar shell
│       └── admin/
│           ├── page.tsx                  # AD1 Overview
│           ├── loading.tsx
│           ├── organizers/
│           │   ├── page.tsx              # AD2 Organizers list
│           │   └── [id]/
│           │       └── page.tsx          # AD2b Organizer detail
│           ├── events/
│           │   └── page.tsx              # AD3 Event oversight
│           ├── gate-agents/
│           │   └── page.tsx              # AD4 Gate agent oversight
│           ├── health/
│           │   └── page.tsx              # AD5 System health
│           └── settings/
│               └── page.tsx              # AD6 Admin settings
│
├── components/
│   ├── ui/                               # shadcn auto-generated
│   ├── Shared/
│   │   ├── Icon.tsx                      # Lucide wrapper
│   │   ├── Button.tsx                    # Matches btn/btn-primary/btn-ghost variants
│   │   ├── StatusPill.tsx                # pill pill-success/danger/warning/info/neutral
│   │   ├── StatCard.tsx                  # KPI card with chip icon + progress bar
│   │   ├── EventCard.tsx                 # Attendee event list card
│   │   ├── ExploreCard.tsx               # 3:4 portrait poster card for /explore
│   │   ├── TicketCard.tsx                # Wallet card with QR code
│   │   ├── TierSelector.tsx              # Ticket category with quantity stepper
│   │   ├── EmptyState.tsx                # Icon + heading + subtext + CTA
│   │   ├── SkeletonCard.tsx              # Shimmer skeleton
│   │   ├── AlertBanner.tsx               # success/danger/warning/info alert
│   │   ├── PhoneInput.tsx                # Country selector + numeric input
│   │   ├── NumberField.tsx               # Numeric-only input with min/max clamp
│   │   ├── FormField.tsx                 # Label + input + inline error
│   │   ├── Modal.tsx                     # Backdrop + dialog
│   │   ├── LineChart.tsx                 # SVG line chart (entry rate)
│   │   └── HBarChart.tsx                 # Horizontal bar chart (tier breakdown)
│   ├── Home/
│   │   ├── Navbar.tsx                    # Sticky landing nav
│   │   ├── HeroSection.tsx               # Hero + HeroArt SVG QR illustration
│   │   ├── HowItWorks.tsx                # 3-step cards
│   │   ├── Features.tsx                  # 2x2 feature grid
│   │   ├── EventTypes.tsx                # 4 event type cards
│   │   ├── CtaBand.tsx                   # Navy CTA footer band
│   │   ├── Footer.tsx
│   │   └── ExploreFilters.tsx            # Category + time chips + city selector
│   ├── Auth/
│   │   ├── AuthBrand.tsx                 # Left panel: logo + feature list
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx              # Includes password strength meter
│   │   └── ForgotPasswordForm.tsx
│   ├── Attendee/
│   │   ├── MobileShell.tsx               # Phone frame + bottom nav
│   │   ├── MobileTopBar.tsx
│   │   ├── BottomNav.tsx
│   │   └── QRDisplay.tsx                 # Full-screen QR view
│   ├── Organizer/
│   │   ├── OrgSidebar.tsx
│   │   ├── OrgTopbar.tsx
│   │   └── CreateEventForm.tsx           # 3-step with step indicator
│   ├── Agent/
│   │   ├── GateSelector.tsx
│   │   ├── Scanner.tsx                   # Camera viewfinder + scan cycle
│   │   ├── ResultOverlay.tsx             # ADMIT/REJECT full-screen
│   │   ├── OfflineSyncSheet.tsx
│   │   └── CashEntrySheet.tsx
│   └── Admin/
│       ├── AdminSidebar.tsx
│       └── AdminTopbar.tsx
│
├── lib/
│   ├── mock-data.ts                      # All static data (see Section 8)
│   ├── utils.ts                          # cn(), formatSSP(), formatDate()
│   └── qr-utils.ts                       # QR code generation with qrcode npm
│
├── types/
│   ├── event.ts
│   ├── ticket.ts
│   ├── user.ts
│   ├── booking.ts
│   └── scan.ts
│
├── constants/
│   ├── countries.ts                      # PHONE_COUNTRIES array (see Section 9)
│   └── routes.ts                         # All route constants
│
└── validations/
    ├── auth.ts                           # loginSchema, registerSchema
    ├── event.ts                          # createEventSchema
    └── booking.ts                        # bookingSchema
```

---

## 6. NAMING CONVENTIONS

```
Folders:         lowercase kebab-case      gate-agents/
Components:      PascalCase                EventCard.tsx
Functions:       camelCase                 formatSSP()
Types:           PascalCase                EventType
Constants:       SCREAMING_SNAKE_CASE      MAX_TICKETS
Zod schemas:     camelCase + Schema        loginSchema
CSS:             Tailwind only — no CSS modules, no inline styles
```

---

## 7. SHELL LAYOUTS

### Attendee shell — (attendee)/layout.tsx

```
- Mobile-only: max-w-[390px] mx-auto
- Fixed bottom nav (Home | Discover | My Tickets | Account)
- Tabs: home → /dashboard, discover → /dashboard (filter),
        tickets → /dashboard/tickets, account → /dashboard/account
- Background: bg-surface-bg
- On screens wider than 480px: show centered phone-frame aesthetic
```

### Organizer shell — (management)/layout.tsx

```
- Desktop-only: min-w-[1024px]
- Fixed left sidebar: 220px wide, bg-brand-navy
- Sidebar nav items (from design-reference/js/organizer.jsx ORG_NAV):
    dashboard, events, create, agents, reports, settings
- Fixed top bar: 56px high, bg-white, border-b
- Content area: overflow-y-auto, internal scroll (sidebar stays fixed)
- On mobile: show "Please use a desktop browser" message
```

### Gate Agent shell — (validation)/layout.tsx

```
- Fullscreen: w-screen h-screen overflow-hidden
- No navigation bar — single-purpose scanner
- Background: bg-brand-navy (dark)
- No max-width constraint
```

### Admin shell — (system)/layout.tsx

```
- Same pattern as Organizer shell
- Sidebar label: "Admin console"
- Admin nav items (from design-reference/js/admin.jsx):
    overview, organizers, events, gate-agents, health, settings
```

---

## 8. MOCK DATA — lib/mock-data.ts

**Copy the data from `design-reference/.../project/js/data.jsx` verbatim.**
Type all values using interfaces from `types/`.

Key exports (all from data.jsx):

```typescript
export const POSTERS: Record<string, string>; // CSS gradient strings
export const EVENTS: EventType[]; // 5 main events
export const EVENT_BY_ID: Record<string, EventType>;
export const MY_TICKETS: TicketType[]; // 3 wallet tickets
export const DASH: DashboardData; // organizer dashboard data
export const ORG_EVENTS: OrgEventRow[]; // organizer events table
export const GATE_AGENTS: GateAgentType[];
export const REPORT: ReportData; // post-event report

// Admin data
export const ADMIN_OVERVIEW: AdminOverviewData;
export const ORGANIZERS: OrganizerType[];
export const ORGANIZER_BY_ID: Record<string, OrganizerType>;
export const ALL_EVENTS: AdminEventRow[];
export const ADMIN_AGENTS: AdminAgentType[];
export const SYSTEM_HEALTH: SystemHealthData;

// Explore data
export const EXPLORE_POSTERS: Record<string, string>;
export const EXPLORE_EVENTS: ExploreEventType[];
export const EXPLORE_BY_ID: Record<string, ExploreEventType>;
export const EXPLORE_CATEGORIES: string[];
export const EXPLORE_TIMES: { id: string; label: string }[];
export const EXPLORE_CITIES: string[];
```

Utility functions in `lib/utils.ts`:

```typescript
export const cn = (...classes) => ...            // clsx + tailwind-merge
export const formatSSP = (n: number) => `SSP ${n.toLocaleString('en-US')}`
export const formatDate = (d: string) => ...
```

---

## 9. COMPONENT SPECS — match design-reference exactly

### PhoneInput — components/Shared/PhoneInput.tsx

Read `design-reference/.../project/js/primitives.jsx` → `PhoneInput` function.

```typescript
// PHONE_COUNTRIES array (from primitives.jsx — copy exactly):
const PHONE_COUNTRIES = [
  { code: "SS", name: "South Sudan", dial: "+211", color: "#0F47AF" },
  { code: "CF", name: "CAR", dial: "+236", color: "#2A6FDB" },
  { code: "CD", name: "DR Congo", dial: "+243", color: "#1F8A5B" },
  { code: "ET", name: "Ethiopia", dial: "+251", color: "#3A7D3A" },
  { code: "KE", name: "Kenya", dial: "+254", color: "#A32D2D" },
  { code: "NG", name: "Nigeria", dial: "+234", color: "#1F8A5B" },
  { code: "RW", name: "Rwanda", dial: "+250", color: "#2A6FDB" },
  { code: "SD", name: "Sudan", dial: "+249", color: "#A83900" },
  { code: "TZ", name: "Tanzania", dial: "+255", color: "#0E7C5A" },
  { code: "UG", name: "Uganda", dial: "+256", color: "#1A1A1A" },
  { code: "GB", name: "UK", dial: "+44", color: "#1F3A93" },
  { code: "US", name: "USA", dial: "+1", color: "#2A4FAF" },
];

interface PhoneValue {
  dial: string;
  code: string;
  num: string;
}
// Default: { dial: '+211', code: 'SS', num: '' }  ← South Sudan always default
```

- Left: colored 2-letter country code box (not emoji) + dial code + chevron
- Right: `type="tel" inputMode="numeric"` — strips non-digits on input, max 12 digits
- Dropdown: searchable by country name or dial code, South Sudan first
- Error renders below the full row
- Combined value for submission: `dial + num` → `"+211912345678"`
- Apply to: login, register, forgot-password, O5 add agent modal, AD2 add organizer modal

### StatusPill — components/Shared/StatusPill.tsx

Read `design-reference/.../project/js/primitives.jsx` → `STATUS_TONE` map.
Map these statuses to tone variants:

```
success: Valid, Admitted, Online, Active, Completed, Confirmed, Published, Live
neutral: Used, Expired, Past, Inactive, Draft, Archived
warning: Selling Fast, Ongoing, Pending, Offline, Low stock
danger:  Sold Out, Rejected, Cancelled, Fraud
info:    Upcoming
```

### ExploreCard — components/Shared/ExploreCard.tsx

Read `design-reference/.../project/js/explore.jsx` → `ExploreCard` component.

```
- Aspect ratio: 3:4 (portrait poster)
- Background: CSS gradient from EXPLORE_POSTERS[category]
- Corner radius: rounded-xl (matches --r-lg)
- Top overlay: status pill (Happening Now! = green dot, or date pill)
- Bottom: dark gradient overlay → event name (large bold white) + venue + price
- Hover: scale-[1.02] transition-transform duration-200
- Gradient posters per category (from data.jsx EXPLORE_POSTERS):
    Music:           linear-gradient(157deg, #3a1d6e 0%, #241a52 45%, #0b1f3a 100%)
    Sports:          linear-gradient(157deg, #0f5132 0%, #0c3a2a 48%, #08283B 100%)
    Conference:      linear-gradient(157deg, #283545 0%, #313d4d 48%, #16181c 100%)
    Church:          linear-gradient(157deg, #5b1626 0%, #3a1320 48%, #0b1f3a 100%)
    Graduation:      linear-gradient(157deg, #7a5e16 0%, #4f421d 45%, #0b2236 110%)
    Food & Drinks:   linear-gradient(157deg, #7a3b12 0%, #5a2f14 48%, #0b1f3a 100%)
    Arts & Culture:  linear-gradient(157deg, #155e63 0%, #123f4f 48%, #08283B 100%)
```

### StatCard — components/Shared/StatCard.tsx

Read `design-reference/.../project/js/primitives.jsx` → `StatCard` function.

```
Props: label, value, chipIcon, chipBg, chipFg, footDot, footText, progress, progressColor
- Chip: small square icon container top-right
- Progress bar below value (if progress prop provided)
- Footer: colored dot + text
```

### LineChart + HBarChart — components/Shared/

Read `design-reference/.../project/js/components.jsx` for the SVG chart implementations.
Reimplement as React SVG components. No third-party chart library needed —
the design uses simple hand-drawn SVG paths and bars.

### HeroArt SVG — components/Home/HeroSection.tsx

Read `design-reference/.../project/js/landing.jsx` → `HeroArt` function.
Copy the exact `mods` matrix and SVG implementation — this is the
flat geometric QR-scan illustration with orange scan beam and corner brackets.

---

## 10. SCREEN-BY-SCREEN RULES

Read the corresponding file in design-reference for each screen.
Below are the rules that require special attention:

### Landing page — (home)/page.tsx

Read: `design-reference/.../project/js/landing.jsx`

```
Sections (in order):
  1. Sticky nav: Tiketi wordmark + Explore Events link + Sign in + Get Started
  2. Hero: navy bg + tagline + 2 CTAs + HeroArt SVG (right column)
  3. How it works: 3 numbered step cards
  4. Built for South Sudan: 2×2 feature grid
  5. For every event in Juba: 4 event-type cards
  6. Navy CTA band: "Ready to run better events?" + Get Started + sign-in link
  7. Footer: wordmark + links + copyright

Mobile: hamburger menu drawer replacing desktop nav links
```

### Explore page — (home)/explore/page.tsx

Read: `design-reference/.../project/js/explore.jsx`

```
- Background: bg-[#060F18] (dark navy — NOT the light bg-surface-bg)
- Sticky sub-header: city selector + search bar
- Category chips row (All/Music/Sports/Conference/Graduation/Church/...)
- Time chips row (Happening Now/Today/Tomorrow/This Weekend/This Month)
- Section "Active Events": horizontal scroll with ExploreCards (happening-now filter)
- Section "Upcoming Events": 4-column grid
- Filter logic: combinable AND — category AND time chips both active
- Search: filters event name case-insensitive
- Click ExploreCard → /explore/[id]
```

### Public Event Preview — (home)/explore/[id]/page.tsx

Read: `design-reference/.../project/js/explore.jsx` → `PublicEventPreview`

```
- No auth required
- Dark navy background
- Large poster header (gradient, 16:9)
- Event title, date, venue, organizer
- About section (collapsible, 3 lines)
- Ticket tiers list: name + price + remaining
- "Book This Ticket" button:
    if logged in → /dashboard/booking/[id]
    if not logged in → /login?banner=booking with AlertBanner info:
      "Sign in to complete your booking"
- Share button: copies URL to clipboard → brief success toast
```

### AUTH1 Sign In — (auth)/login/page.tsx

Read: `design-reference/.../project/js/auth.jsx` → `SignIn`

```
- Split layout: left brand panel (AuthBrand) + right form card
- AuthBrand: Tiketi logo + tagline + 3 feature rows
  (QR validation, Offline scanning, Mobile money)
- Form: PhoneInput + password (show/hide toggle) + forgot link
- Submit: loading spinner on button, 1.1s simulated delay → redirect /dashboard
- Error state (banner): "Incorrect phone number or password"
- Validation: phone min 7 digits, password min 6 chars, inline errors
```

### AUTH2 Register — (auth)/register/page.tsx

Read: `design-reference/.../project/js/auth.jsx` → `Register`

```
- Same split layout as sign in
- Fields: full name, phone (PhoneInput), password + confirm, role toggle
- Role toggle pills: Attendee | Organizer
- Password strength meter: weak (<8) / fair (8+ mixed) / strong (10+ mixed + special)
- Confirm password: "Passwords do not match" if not equal
- On submit → /login with success banner "Account created. Sign in to continue."
```

### A1 Home — (attendee)/dashboard/page.tsx

Read: `design-reference/.../project/js/attendee.jsx` → `HomeScreen`

```
- Mobile shell max-w-[390px]
- Top bar: "Discover" + notification bell
- Search bar: "Search events in Juba..."
- Filter chips: All/Concert/Football/Conference/Graduation
- Featured hero EventCard (full-width) for EVENTS.find(e => e.featured)
- "Upcoming events" section + EventCard list
- States: loaded | skeleton (EventCardSkeleton) | empty (EmptyState)
```

### A2 Event Detail — (attendee)/dashboard/event/[id]/page.tsx

Read: `design-reference/.../project/js/attendee.jsx` → `DetailScreen`

```
- Gradient poster hero (full-width, 240px height)
- Back arrow overlaid on poster
- Event category pill, title, organizer
- Date + venue info rows with icons
- Collapsible "About this event" section
- TierSelector for each ticket tier (name, price, capacity, stepper)
- Sticky bottom bar: total SSP + "Book Tickets" button (disabled if qty=0)
- States: loaded | skeleton | soldout (all tiers gray, sold-out pills)
```

### A3 Booking Summary — (attendee)/dashboard/booking/[id]/page.tsx

Read: `design-reference/.../project/js/attendee.jsx` → `BookingScreen`

```
- Order summary card: event, date, selected tiers + quantities, line items, total
- Payment method selector: MTN Mobile Money | Airtel Money (radio)
- Validation: at least 1 tier selected, quantity ≤ remaining capacity
- "Confirm Booking" button disabled if total = 0
- Loading state on confirm
```

### A4 Payment — (attendee)/dashboard/payment/[id]/page.tsx

Read: `design-reference/.../project/js/attendee.jsx` → `PaymentScreen`

```
- Compact order summary (collapsed)
- USSD code in font-mono, large, full-width bordered box, copy icon
- "Open Dialer" button: href={`tel:${ussdCode}`}
- Countdown timer: starts 5:00, counts to 0:00
  → at 0:00: show timeout AlertBanner danger + "Try Again" button
- Waiting state: "Waiting for payment confirmation..." + spinner
- On timeout → release reserved tickets (update local state)
```

### A5 Confirmation — (attendee)/dashboard/confirmation/page.tsx

Read: `design-reference/.../project/js/attendee.jsx` → `ConfirmScreen`

```
- Success icon (large, centered, status-success color)
- "Booking Confirmed" heading
- Booking reference in font-mono
- Summary: event, date, ticket count, total paid
- AlertBanner info: "Ticket link sent to +211 XXX XXX XXX"
- CTAs: "View My Tickets" (primary) | "Back to Home" (ghost)
```

### A6 Ticket Wallet — (attendee)/dashboard/tickets/page.tsx

Read: `design-reference/.../project/js/attendee.jsx` → `WalletScreen`

```
- Filter tabs: Upcoming | Past
- TicketCard list: event info + QR placeholder + StatusPill
- Tap card → expand to full QR view (A7)
- Empty (Upcoming): "No upcoming tickets. Browse events to book." + Browse CTA
- Empty (Past): "No past events yet."
- Loading: 3 SkeletonCards
```

### A7 QR View — (attendee)/dashboard/tickets/[id]/page.tsx

Read: `design-reference/.../project/js/attendee.jsx` → `QRScreen`

```
- Full-screen modal or dedicated screen
- Event name, date, venue
- Large QR code (centered, ~240px) — use qrcode npm to generate actual QR
  from ticket ID, not a placeholder image
- Ticket ID below QR in font-mono
- Tier badge + StatusPill
- Dismissible info AlertBanner: "Increase screen brightness for faster scanning"
- Share button in header
```

### G1 Event Selector — (validation)/agent/page.tsx

Read: `design-reference/.../project/js/gate.jsx` → `GateSelector`

```
- Dark bg-brand-navy, fullscreen
- Tiketi Gate branding: scan-line icon + "Tiketi Gate" / "Scanner"
- Gate agent avatar (initials) + name + date
- Event dropdown selector
- Pre-fetch states (use useEffect + setTimeout to simulate):
    downloading: progress bar 0→100% (7% per 130ms)
    ready: "2,000 tickets ready for offline validation" (success alert)
    failed: danger alert + "Retry download" button
- "Start Scanning" button: disabled until phase === 'ready'
- State toggle: ready | downloading | failed
```

### G2 QR Scanner — (validation)/agent/scanner/page.tsx

Read: `design-reference/.../project/js/gate.jsx` → `GateScanner`

```
- Fullscreen dark bg
- Top bar (compact): event name | admitted count | Online/Offline pill
- Camera viewfinder (center, ~60% screen height) with animated scan line
- "Scan QR" button in demo mode

DEMO MODE — consecutive taps cycle through these outcomes:
  1. admit    → full-screen bg-green-700, checkmark icon, "ADMIT", attendee name, tier
  2. used     → full-screen bg-red-700, x icon, "ALREADY USED", "First scanned at 2:34 PM at Gate A"
  3. invalid  → full-screen bg-red-700, x icon, "INVALID TICKET", "This ticket could not be verified"
  4. wrong    → full-screen bg-amber-700, alert-triangle icon, "WRONG EVENT", "This ticket is for a different event"
  5. expired  → full-screen bg-slate-800, clock icon, "TICKET EXPIRED", "This ticket is no longer valid"
  → repeats from 1

Each result overlay:
  - useEffect auto-reset after 2 seconds (countdown shown)
  - Full-screen colored overlay
  - Large icon (64px, white, strokeWidth 2.5)
  - Verdict text in large bold white (font-display)
  - Auto-reset countdown: "Auto-reset in Xs"
  - Tap overlay to reset immediately

Offline mode: warning banner at top "Offline mode — scans saved locally"
Top bar menu → G8 Offline Sync sheet + G9 Cash Entry
```

### G8 Offline Sync — slide-up sheet in scanner

Read: `design-reference/.../project/js/gate.jsx` → `OfflineSyncSheet`

```
- Slide-up bottom sheet (not a separate route)
- "X scans recorded locally, pending sync" (amber warning)
- Last sync timestamp
- "Sync Now" button: disabled when offline, enabled when online
- "Simulate connection restored" button (for demo)
- Progress bar when syncing
- "All scans uploaded" success state
```

### G9 Cash Entry — (validation)/agent/cash-entry/page.tsx

Read: `design-reference/.../project/js/gate.jsx` → `CashEntrySheet`

```
- FormField: Attendee name (required, min 2 chars)
- SelectField: Ticket category (required)
- NumberField: Amount paid in SSP (required)
  → warn (not error) if differs from tier price: "Expected 50 SSP for General Admission"
- "Record Entry" button: disabled if name or category empty
- On submit: brief success flash → reset form → return to scanner
```

### O1 Dashboard — (management)/organizer/page.tsx

Read: `design-reference/.../project/js/organizer.jsx` → `OrgDashboard`

```
- Page header: event name + "Live" pulsing StatusPill + last-sync timestamp
- 4 StatCards: Admitted (with progress bar), Tickets Sold, Fraud Attempts, Revenue
- LineChart: entry rate (x=time, y=admissions per 30min)
- 2-column grid (lg):
    Left: HBarChart — tier breakdown
    Right: recent scans table (Time | Gate | Tier | Result pill)
- States: live | loading (skeleton StatCards + skeleton chart) | noevent (EmptyState)
```

### O3 Create Event — (management)/organizer/events/create/page.tsx

Read: `design-reference/.../project/js/organizer2.jsx` → `OrgCreate`

```
3-step form with step indicator (active=orange dot, done=green checkmark):

Step 1 — Event details:
  title (min 5), description (min 20), venue, date (future only),
  time, category (select), poster upload zone (optional, show preview)
  Validation blocks Next if any required field invalid

Step 2 — Ticket categories:
  Repeatable category blocks (max 10):
    name, price (NumberField min=0), capacity (NumberField min=1),
    sale opens date, sale closes date (must be before event date)
  At least 1 category required

Step 3 — Review & Publish:
  Read-only summary of all event details
  Validation summary table: green ✓ rows for valid, red ✗ for invalid
  "Save as Draft" ghost | "Publish Event" primary
  On publish: add event to local state → redirect to /organizer/events
    → show success toast "Event published successfully"
```

### AD1–AD6 Admin screens

Read: `design-reference/.../project/js/admin.jsx`

```
AD1 Overview: 4 StatCards + platform sales line chart + recent activity table
AD2 Organizers: searchable table + Add Organizer modal (PhoneInput, duplicate check)
AD2b Detail: organizer info + Events/Gate Agents/Activity Log tabs
AD3 Events: all events table with Flagged tab (fraud > 5)
AD4 Gate Agents: table + scan history modal + deactivate confirmation
AD5 System Health: uptime stats + 7 service rows + Airtel degraded warning
AD6 Settings: masked API credentials + system config NumberFields +
              Rotate JWT Key danger modal (consequence warning)
```

---

## 11. FORM VALIDATION

All forms use **React Hook Form + Zod**. All errors inline below field.
**Never use alert(), window.confirm(), or browser-native validation.**

### validations/auth.ts

```typescript
import { z } from "zod";

const phoneValueSchema = z.object({
  dial: z.string(),
  code: z.string(),
  num: z
    .string()
    .min(1, "Phone number is required")
    .min(7, "Enter a valid phone number")
    .regex(/^\d+$/, "Phone number must be digits only"),
});

export const loginSchema = z.object({
  phone: phoneValueSchema,
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "At least 6 characters"),
});

export const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    phone: phoneValueSchema,
    password: z.string().min(8, "At least 8 characters"),
    confirmPassword: z.string(),
    role: z.enum(["attendee", "organizer"], {
      required_error: "Select a role",
    }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
```

### validations/event.ts

```typescript
export const createEventSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  venue: z.string().min(1, "Venue is required"),
  date: z
    .string()
    .refine((d) => new Date(d) > new Date(), "Date must be in the future"),
  time: z.string().min(1, "Time is required"),
  category: z.string().min(1, "Category is required"),
  categories: z
    .array(
      z.object({
        name: z.string().min(1, "Category name is required"),
        price: z.number().min(0, "Price must be 0 or more"),
        capacity: z.number().min(1, "Capacity must be at least 1"),
        saleOpens: z.string().min(1, "Sale opens date is required"),
        saleCloses: z.string().min(1, "Sale closes date is required"),
      }),
    )
    .min(1, "At least one ticket category is required"),
});
```

### Number field rules

```
O3 price:              type="number" min=0, strip non-numeric on input
O3 capacity:           type="number" min=1, strip non-numeric on input
G9 amount:             type="number" min=0, warn if ≠ tier price
AD6 maxCategories:     type="number" min=1 max=20, clamp on blur
AD6 paymentTimeout:    type="number" min=1 max=60, clamp on blur
AD6 smsRetries:        type="number" min=1 max=10, clamp on blur
```

---

## 12. QR CODE GENERATION — lib/qr-utils.ts

```typescript
import QRCode from "qrcode";

// Generate a data URL for a ticket QR code
export async function generateTicketQR(ticketId: string): Promise<string> {
  return QRCode.toDataURL(ticketId, {
    errorCorrectionLevel: "H",
    margin: 2,
    color: { dark: "#08283B", light: "#FFFFFF" },
    width: 240,
  });
}
```

Use this in A7 QR View — generate a real scannable QR from the ticket ID.

---

## 13. EVERY SCREEN NEEDS THESE STATES

Match the prototype's state toggle behavior:

| State   | Implementation                                                      |
| ------- | ------------------------------------------------------------------- |
| Loaded  | Full content from mock data                                         |
| Loading | `loading.tsx` file + `<Suspense>` + skeleton components             |
| Empty   | `EmptyState` component (icon + heading + subtext + optional CTA)    |
| Error   | `error.tsx` file, `'use client'`, AlertBanner danger + reset button |

Skeleton components must match the loaded layout exactly —
same card dimensions, same spacing, shimmer animation:

```css
/* In globals.css */
@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}
.skeleton {
  background: linear-gradient(90deg, #e2e0d8 25%, #f0ede8 50%, #e2e0d8 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
  border-radius: 4px;
}
```

---

## 14. ACCESSIBILITY

```
✅ ARIA labels on ALL interactive elements:
   <button aria-label="Copy USSD code">
   <input aria-label="Phone number" />
   <nav aria-label="Primary navigation">

✅ Keyboard navigation works everywhere
✅ Focus rings: focus-visible:ring-2 focus-visible:ring-brand-orange

✅ Minimum touch targets on mobile: min-h-[48px] min-w-[48px]
   (gate agent screens especially — scanned in field conditions)

✅ Screen reader text for icon-only buttons:
   <span className="sr-only">Close dialog</span>

✅ Color contrast: all text WCAG AA compliant
✅ Gate result screens (ADMIT/REJECT): maximum contrast, large text
   Must be readable at arm's length in bright sunlight
```

---

## 15. WHAT NEVER TO DO

```
❌ Never use the pages/ router
❌ Never use getServerSideProps / getStaticProps / getInitialProps
❌ Never import from next/router — use next/navigation
❌ Never use alert() or window.confirm()
❌ Never hardcode hex color values — use Tailwind classes only
❌ Never use TypeScript 'any' type
❌ Never call external APIs — mock data only
❌ Never use CSS files or CSS modules — Tailwind only
❌ Never use emoji in UI components
❌ Never use <img> for event posters — use CSS gradients (backgroundImage)
❌ Never skip loading.tsx and error.tsx files in route folders
❌ Never put 'use client' below imports — it must be line 1
❌ Never mutate mock data arrays directly — copy then update local state
❌ Never use localStorage for persistence
❌ Never use third-party chart libraries — implement SVG charts directly
   (see LineChart and HBarChart components in design-reference/js/components.jsx)
```

---

## 16. BUILD ORDER — follow exactly

```
Phase 1 — Foundation (run npx tsc --noEmit after each phase)
  1.  tailwind.config.ts          Brand + status colors + fonts + radii
  2.  src/app/globals.css         Google Fonts import + Tailwind directives
  3.  src/types/                  All TypeScript interfaces
  4.  src/constants/countries.ts  PHONE_COUNTRIES array (from primitives.jsx)
  5.  src/constants/routes.ts     All route path constants
  6.  src/lib/mock-data.ts        Copy all data from data.jsx verbatim, typed
  7.  src/lib/utils.ts            cn(), formatSSP(), formatDate()
  8.  src/lib/qr-utils.ts         QR generation helper
  9.  src/validations/            All Zod schemas

Phase 2 — Shared components
  10. components/Shared/          All reusable components
      (PhoneInput last — depends on countries.ts)

Phase 3 — Public pages
  11. components/Home/            All landing + explore section components
  12. app/(home)/page.tsx         Landing page
  13. app/(home)/explore/         Explore + event preview

Phase 4 — Auth
  14. components/Auth/            Auth form components
  15. app/(auth)/                 Login, register, forgot-password

Phase 5 — Attendee
  16. components/Attendee/        Mobile shell components
  17. app/(attendee)/layout.tsx   Bottom nav shell
  18. app/(attendee)/dashboard/   A1–A8 screens

Phase 6 — Organizer
  19. components/Organizer/       Sidebar + form components
  20. app/(management)/layout.tsx Desktop sidebar shell
  21. app/(management)/organizer/ O1–O7 screens

Phase 7 — Gate Agent
  22. components/Agent/           Scanner + result components
  23. app/(validation)/layout.tsx Fullscreen shell
  24. app/(validation)/agent/     G1, G2, G9 screens

Phase 8 — Admin
  25. components/Admin/           Admin sidebar components
  26. app/(system)/layout.tsx     Admin sidebar shell
  27. app/(system)/admin/         AD1–AD6 screens

After every phase: npx tsc --noEmit → fix ALL errors before continuing.
Final check: npm run build → must complete with zero errors.
```

---

## 17. SOUTH SUDAN CONTEXT

```
Currency:     SSP (South Sudanese Pound)
              formatSSP(18000) → "SSP 18,000"

Phone:        +211 format, 9 local digits
              Default in PhoneInput: South Sudan +211

Payments:     MTN Mobile Money   (USSD: *165#)
              Airtel Money       (USSD: *185#)

Cities:       Juba (primary), Wau, Malakal, Yei

Venues:       Nyakuron Cultural Centre, Juba
              Juba National Stadium
              Freedom Hall, Juba
              Crown Hotel, Juba
              Dr. John Garang Mausoleum Grounds
              UoJ Main Hall
              Radisson Juba
              Eden Garden Juba
              UNMISS Hall

People:       Achol Deng, Manute Bol Jr., Nyandeng Garang,
              Peter Lado, Aban Wani, Sunday Akol,
              James Majok, Rebecca Aluel, Daniel Garang,
              Mary Nyibol, Rebecca Mayen, Grace Lado

Organizations: Nile Live Events, SSFA, University of Juba,
               South Sudan Digital Forum, Grace Arena,
               AmaliTech Events, Ministry of Youth,
               SS Chamber of Commerce
```

---

## 18. VERIFICATION CHECKLIST

Before marking any phase complete:

```
[ ] npx tsc --noEmit — zero TypeScript errors
[ ] All routes in this phase return 200 (no 404)
[ ] PhoneInput defaults to South Sudan +211
[ ] Typing letters in phone number field → silently stripped
[ ] Number fields (price, capacity, amount) → letters stripped
[ ] All form errors are inline, never alert()
[ ] Loading skeleton renders at correct dimensions (matches loaded layout)
[ ] Empty state renders with icon + heading + subtext
[ ] Error boundary renders AlertBanner danger + retry button
[ ] No hardcoded colors in className (Tailwind classes only)
[ ] font-mono applied to: ticket IDs, booking refs, USSD codes, API keys
[ ] Gate scanner cycles all 5 result outcomes on consecutive taps
[ ] ADMIT screen: full green, large checkmark, readable at arm's length
[ ] Payment countdown reaches 0:00 and shows timeout state
[ ] Create event publishes → redirects to O2 with new event at top
[ ] ARIA labels present on all interactive elements
[ ] Min 48px touch targets on all mobile screens
[ ] npm run build — zero errors, no missing modules
```

---

_This AGENTS.md was generated from the approved Claude Design prototype.
The design-reference/ folder is the visual source of truth.
When in doubt, read the design file — it takes precedence over this document._
