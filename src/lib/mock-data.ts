// Tiketi — mock data (South Sudan / Juba context). Static, UI-only.
// Copied VERBATIM from design-reference/.../js/data.jsx with TypeScript types applied.

import type {
  EventType,
  OrgEventRow,
  AdminEventRow,
  ExploreEventType,
} from "@/types/event";
import type { TicketType } from "@/types/ticket";
import type {
  OrganizerType,
  GateAgentType,
  AdminAgentType,
} from "@/types/user";
import type { DashboardData, ReportData } from "@/types/booking";
import type {
  AgentScanHistoryRecord,
  SystemHealthData,
  AdminOverviewData,
  ActivityRecord,
} from "@/types/scan";

// ============================================================
// POSTERS — gradient "posters" (clean placeholders)
// ============================================================
export const POSTERS: Record<string, string> = {
  concert: "linear-gradient(135deg, #08283B 0%, #14506b 55%, #FF5A00 140%)",
  concert2: "linear-gradient(150deg, #2a1a3f 0%, #6b2447 60%, #FF5A00 150%)",
  football: "linear-gradient(135deg, #08283B 0%, #1A6B3C 110%)",
  conference: "linear-gradient(140deg, #0b2b3d 0%, #466177 100%)",
  graduation: "linear-gradient(135deg, #08283B 0%, #3a2d6b 70%, #A83900 150%)",
};

// ============================================================
// EVENTS — main event catalogue (5 events)
// ============================================================
export const EVENTS: EventType[] = [
  {
    id: "evt-jmf",
    title: "Juba Music Festival 2025",
    category: "Concert",
    poster: POSTERS.concert,
    image:
      "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=600&q=80",
    organizer: "Nile Live Events",
    date: "Sat, 14 Dec 2025",
    time: "6:00 PM – 11:00 PM",
    venue: "Nyakuron Cultural Centre, Juba",
    featured: true,
    about:
      "The biggest night of live music in South Sudan returns to Nyakuron. Three stages, fifteen artists, and food vendors from across Juba. Gates open at 5:00 PM. No re-entry after 9:00 PM.",
    tiers: [
      {
        id: "vip",
        name: "VIP",
        price: 35,
        capacity: 400,
        remaining: 12,
        lowStock: true,
      },
      {
        id: "gen",
        name: "General",
        price: 14,
        capacity: 1400,
        remaining: 612,
      },
      {
        id: "stu",
        name: "Student",
        price: 7,
        capacity: 200,
        remaining: 0,
        soldOut: true,
      },
    ],
  },
  {
    id: "evt-psl",
    title: "South Sudan Premier League Final",
    category: "Football",
    poster: POSTERS.football,
    image:
      "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=600&q=80",
    organizer: "SSFA",
    date: "Sun, 22 Dec 2025",
    time: "4:00 PM kick-off",
    venue: "Juba National Stadium",
    about:
      "The title decider. Defending champions face the league's top scorers in a sold-out showdown. Turnstiles open two hours before kick-off.",
    tiers: [
      {
        id: "vip",
        name: "VIP Stand",
        price: 20,
        capacity: 600,
        remaining: 88,
      },
      {
        id: "gen",
        name: "General Stand",
        price: 5,
        capacity: 8000,
        remaining: 2340,
      },
    ],
  },
  {
    id: "evt-grad",
    title: "University of Juba Graduation 2025",
    category: "Graduation",
    poster: POSTERS.graduation,
    image:
      "https://images.unsplash.com/photo-1627556704302-624286467c65?w=600&q=80",
    organizer: "University of Juba",
    date: "Fri, 5 Dec 2025",
    time: "9:00 AM",
    venue: "Freedom Hall, Juba",
    about:
      "The 2025 commencement ceremony for the graduating class. Each graduand is allocated guest tickets. Doors close promptly at 8:45 AM.",
    tiers: [
      {
        id: "fam",
        name: "Family Guest",
        price: 4,
        capacity: 1200,
        remaining: 140,
      },
    ],
  },
  {
    id: "evt-tech",
    title: "Juba Tech & Innovation Summit",
    category: "Conference",
    poster: POSTERS.conference,
    image:
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80",
    organizer: "South Sudan Digital Forum",
    date: "Wed, 17 Dec 2025",
    time: "8:30 AM – 5:00 PM",
    venue: "Crown Hotel, Juba",
    about:
      "A full-day gathering of founders, developers, and policymakers shaping South Sudan's digital economy. Includes lunch and a networking reception.",
    tiers: [
      {
        id: "del",
        name: "Delegate",
        price: 25,
        capacity: 300,
        remaining: 47,
      },
      {
        id: "stu",
        name: "Student",
        price: 10,
        capacity: 100,
        remaining: 9,
        lowStock: true,
      },
    ],
  },
  {
    id: "evt-gospel",
    title: "Juba Gospel Night",
    category: "Concert",
    poster: POSTERS.concert2,
    image:
      "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=600&q=80",
    organizer: "Grace Arena",
    date: "Sat, 28 Dec 2025",
    time: "5:00 PM",
    venue: "Dr. John Garang Mausoleum Grounds",
    about:
      "An evening of worship and live gospel music under the Juba sky, featuring choirs from across the region.",
    tiers: [
      {
        id: "gen",
        name: "General",
        price: 5,
        capacity: 3000,
        remaining: 1820,
      },
      { id: "vip", name: "VIP", price: 15, capacity: 250, remaining: 64 },
    ],
  },
];

export const EVENT_BY_ID: Record<string, EventType> = Object.fromEntries(
  EVENTS.map((e) => [e.id, e]),
);

// ============================================================
// ATTENDEE WALLET — tickets (MY_TICKETS)
// ============================================================
export const MY_TICKETS: TicketType[] = [
  {
    id: "TIX-7K2M-9QX4",
    qrPayload: "TIX-7K2M-9QX4:evt-jmf:mock-user",
    eventId: "evt-jmf",
    tier: "VIP",
    status: "Valid",
    when: "upcoming",
  },
  {
    id: "TIX-4B8N-2WP1",
    qrPayload: "TIX-4B8N-2WP1:evt-tech:mock-user",
    eventId: "evt-tech",
    tier: "Delegate",
    status: "Valid",
    when: "upcoming",
  },
  {
    id: "TIX-1A5C-8RT6",
    qrPayload: "TIX-1A5C-8RT6:evt-psl:mock-user",
    eventId: "evt-psl",
    tier: "General Stand",
    status: "Used",
    when: "past",
  },
];

// ============================================================
// ORGANIZER DASHBOARD — DASH
// ============================================================
export const DASH: DashboardData = {
  eventId: "mock-event-1",
  eventName: "Juba Music Festival 2025",
  admitted: 1247,
  capacity: 2000,
  sold: 1891,
  fraud: 4,
  revenue: 37840,
  entryRate: [
    { t: "17:00", v: 40 },
    { t: "17:30", v: 120 },
    { t: "18:00", v: 286 },
    { t: "18:30", v: 341 },
    { t: "19:00", v: 220 },
    { t: "19:30", v: 130 },
    { t: "20:00", v: 74 },
    { t: "20:30", v: 36 },
  ],
  tiers: [
    {
      name: "VIP",
      count: 388,
      total: 1247,
      color: "var(--color-brand-orange)",
    },
    {
      name: "General",
      count: 712,
      total: 1247,
      color: "var(--color-brand-navy)",
    },
    {
      name: "Student",
      count: 147,
      total: 1247,
      color: "var(--color-status-info)",
    },
  ],
  scans: [
    { time: "19:42:08", gate: "Gate A", tier: "General", result: "ADMIT" },
    { time: "19:41:55", gate: "Gate B", tier: "VIP", result: "ADMIT" },
    { time: "19:41:32", gate: "Gate A", tier: "General", result: "REJECT" },
    { time: "19:41:10", gate: "Gate C", tier: "Student", result: "ADMIT" },
    { time: "19:40:47", gate: "Gate A", tier: "General", result: "ADMIT" },
    { time: "19:40:21", gate: "Gate B", tier: "VIP", result: "ADMIT" },
    { time: "19:39:58", gate: "Gate C", tier: "General", result: "REJECT" },
    { time: "19:39:30", gate: "Gate A", tier: "Student", result: "ADMIT" },
    { time: "19:39:02", gate: "Gate B", tier: "General", result: "ADMIT" },
    { time: "19:38:44", gate: "Gate A", tier: "VIP", result: "ADMIT" },
  ],
};

// ============================================================
// ATTENDEE NAMES (for gate demo simulations)
// ============================================================
export const ATTENDEE_NAMES: string[] = [
  "Achol Deng",
  "Manute Bol Jr.",
  "Nyandeng Garang",
  "Peter Lado",
  "Aban Wani",
  "Sunday Akol",
];

// ============================================================
// ORGANIZER EVENTS TABLE — ORG_EVENTS
// ============================================================
export const ORG_EVENTS: OrgEventRow[] = [
  {
    id: "evt-jmf",
    name: "Juba Music Festival 2025",
    date: "14 Dec 2025",
    venue: "Nyakuron Cultural Centre",
    sold: 1891,
    capacity: 2000,
    status: "Ongoing",
    category: "Concert",
    image: null,
    poster: "linear-gradient(157deg, #3a1d6e 0%, #241a52 45%, #0b1f3a 100%)",
  },
  {
    id: "evt-psl",
    name: "South Sudan Premier League Final",
    date: "22 Dec 2025",
    venue: "Juba National Stadium",
    sold: 6260,
    capacity: 8600,
    status: "Upcoming",
    category: "Football",
    image: null,
    poster: "linear-gradient(157deg, #0f5132 0%, #0c3a2a 48%, #08283B 100%)",
  },
  {
    id: "evt-tech",
    name: "Juba Tech & Innovation Summit",
    date: "17 Dec 2025",
    venue: "Crown Hotel",
    sold: 244,
    capacity: 400,
    status: "Upcoming",
    category: "Conference",
    image: null,
    poster: "linear-gradient(157deg, #283545 0%, #313d4d 48%, #16181c 100%)",
  },
  {
    id: "evt-grad",
    name: "University of Juba Graduation 2025",
    date: "5 Dec 2025",
    venue: "Freedom Hall",
    sold: 1060,
    capacity: 1200,
    status: "Completed",
    category: "Graduation",
    image: null,
    poster: "linear-gradient(157deg, #7a5e16 0%, #4f421d 45%, #0b2236 110%)",
  },
  {
    id: "evt-gospel",
    name: "Juba Gospel Night",
    date: "28 Dec 2025",
    venue: "Garang Mausoleum Grounds",
    sold: 0,
    capacity: 3250,
    status: "Draft",
    category: "Concert",
    image: null,
    poster: "linear-gradient(157deg, #5b1626 0%, #3a1320 48%, #0b1f3a 100%)",
  },
];

// ============================================================
// ORGANIZER GATE AGENTS — GATE_AGENTS
// ============================================================
export const GATE_AGENTS: GateAgentType[] = [
  {
    id: 1,
    name: "James Majok",
    phone: "+211 922 481 003",
    event: "Juba Music Festival 2025",
    gate: "Gate A",
    status: "Active",
    image: null,
  },
  {
    id: 2,
    name: "Rebecca Aluel",
    phone: "+211 955 102 778",
    event: "Juba Music Festival 2025",
    gate: "Gate B",
    status: "Active",
    image: null,
  },
  {
    id: 3,
    name: "Daniel Garang",
    phone: "+211 928 640 219",
    event: "Juba Music Festival 2025",
    gate: "Gate C",
    status: "Inactive",
    image: null,
  },
  {
    id: 4,
    name: "Mary Nyibol",
    phone: "+211 911 305 884",
    event: "SSPL Final",
    gate: "Turnstile 2",
    status: "Active",
    image: null,
  },
];

// ============================================================
// POST-EVENT REPORT — REPORT (University of Juba Graduation)
// ============================================================
export const REPORT: ReportData = {
  event: "University of Juba Graduation 2025",
  attended: 1043,
  revenue: 4172,
  fraud: 7,
  duration: "1h 52m",
  entryRate: [
    { t: "07:30", v: 60 },
    { t: "08:00", v: 410 },
    { t: "08:30", v: 520 },
    { t: "09:00", v: 180 },
    { t: "09:30", v: 40 },
    { t: "10:00", v: 12 },
  ],
  tiers: [
    {
      name: "Family",
      count: 1043,
      total: 1043,
      color: "var(--color-brand-orange)",
    },
  ],
  fraudRows: [
    {
      time: "08:14:22",
      gate: "Gate A",
      reason: "Already used",
      frag: "TIX-…-9QX4",
    },
    {
      time: "08:21:09",
      gate: "Gate B",
      reason: "Invalid signature",
      frag: "TIX-…-1ZK8",
    },
    {
      time: "08:33:51",
      gate: "Gate A",
      reason: "Wrong event",
      frag: "TIX-…-7TT0",
    },
    {
      time: "08:40:17",
      gate: "Gate B",
      reason: "Already used",
      frag: "TIX-…-4MM2",
    },
    {
      time: "08:47:44",
      gate: "Gate A",
      reason: "Invalid signature",
      frag: "TIX-…-0QP5",
    },
    { time: "09:02:30", gate: "Gate B", reason: "Expired", frag: "TIX-…-3RX9" },
    {
      time: "09:10:58",
      gate: "Gate A",
      reason: "Already used",
      frag: "TIX-…-8WB1",
    },
  ],
};

// ============================================================
// ADMIN DATA — system-wide
// ============================================================
export const ADMIN_OVERVIEW: AdminOverviewData = {
  organizers: 24,
  activeToday: 3,
  ticketsAllTime: 14820,
  fraud30d: 47,
  salesTrend: [
    { t: "22 Nov", v: 210 },
    { t: "24", v: 340 },
    { t: "26", v: 290 },
    { t: "28", v: 520 },
    { t: "30", v: 610 },
    { t: "2 Dec", v: 880 },
    { t: "4", v: 1240 },
    { t: "6", v: 1610 },
  ],
  activity: [
    {
      time: "Today 14:22",
      actor: "Juba FC",
      action: 'Created event "SSPL Final"',
      status: "Completed",
    },
    {
      time: "Today 13:48",
      actor: "RwandanTechEvents",
      action: "Published 3 ticket categories",
      status: "Completed",
    },
    {
      time: "Today 12:30",
      actor: "Gate agent · J. Majok",
      action: "Scanned an invalid ticket",
      status: "Pending",
    },
    {
      time: "Today 11:05",
      actor: "Grace Lado",
      action: "Registered as organizer",
      status: "Upcoming",
    },
    {
      time: "Today 09:51",
      actor: "Nile Live Events",
      action: "Rotated API key",
      status: "Completed",
    },
    {
      time: "Yesterday",
      actor: "University of Juba",
      action: "Marked event completed",
      status: "Completed",
    },
  ] satisfies ActivityRecord[],
};

export const ORGANIZERS: OrganizerType[] = [
  {
    id: "org-nile",
    name: "Nile Live Events",
    contact: "Rebecca Mayen",
    phone: "+211 922 700 145",
    org: "Nile Live Events",
    events: 5,
    revenue: 3708,
    status: "Active",
    joined: "12 Aug 2025",
  },
  {
    id: "org-ssfa",
    name: "South Sudan Football Assoc.",
    contact: "Peter Bol",
    phone: "+211 955 318 220",
    org: "SSFA",
    events: 3,
    revenue: 7423,
    status: "Active",
    joined: "3 Sep 2025",
  },
  {
    id: "org-uoj",
    name: "University of Juba",
    contact: "Dr. Akol Deng",
    phone: "+211 911 470 660",
    org: "University of Juba",
    events: 2,
    revenue: 4172,
    status: "Active",
    joined: "21 Jul 2025",
  },
  {
    id: "org-amali",
    name: "RwandanTechEvents",
    contact: "Grace Lado",
    phone: "+211 928 905 412",
    org: "AmaliTech",
    events: 4,
    revenue: 1646,
    status: "Active",
    joined: "1 Oct 2025",
  },
  {
    id: "org-grace",
    name: "Grace Arena",
    contact: "Simon Wani",
    phone: "+211 920 661 037",
    org: "Grace Arena",
    events: 1,
    revenue: 292,
    status: "Suspended",
    joined: "18 Oct 2025",
  },
];

export const ORGANIZER_BY_ID: Record<string, OrganizerType> =
  Object.fromEntries(ORGANIZERS.map((o) => [o.id, o]));

export const ORG_ACTIVITY: Array<{ time: string; action: string }> = [
  { time: "6 Dec 2025 09:51", action: "Rotated Africa's Talking API key" },
  {
    time: "2 Dec 2025 16:20",
    action: 'Published event "Juba Music Festival 2025"',
  },
  { time: "1 Dec 2025 11:04", action: 'Added gate agent "James Majok"' },
  {
    time: "28 Nov 2025 14:33",
    action: 'Created event "Juba Music Festival 2025"',
  },
  { time: "12 Aug 2025 08:00", action: "Registered as organizer" },
];

export const ALL_EVENTS: AdminEventRow[] = [
  {
    id: "evt-jmf",
    name: "Juba Music Festival 2025",
    organizer: "Nile Live Events",
    date: "14 Dec 2025",
    sold: 1891,
    fraud: 4,
    flagged: false,
    status: "Ongoing",
  },
  {
    id: "evt-psl",
    name: "South Sudan Premier League Final",
    organizer: "SSFA",
    date: "22 Dec 2025",
    sold: 6260,
    fraud: 9,
    flagged: true,
    status: "Upcoming",
  },
  {
    id: "evt-tech",
    name: "Juba Tech & Innovation Summit",
    organizer: "RwandanTechEvents",
    date: "17 Dec 2025",
    sold: 244,
    fraud: 1,
    flagged: false,
    status: "Upcoming",
  },
  {
    id: "evt-grad",
    name: "University of Juba Graduation 2025",
    organizer: "University of Juba",
    date: "5 Dec 2025",
    sold: 1060,
    fraud: 7,
    flagged: true,
    status: "Completed",
  },
  {
    id: "evt-gospel",
    name: "Juba Gospel Night",
    organizer: "Grace Arena",
    date: "28 Dec 2025",
    sold: 0,
    fraud: 0,
    flagged: false,
    status: "Draft",
  },
];

export const ADMIN_AGENTS: AdminAgentType[] = [
  {
    id: 1,
    name: "James Majok",
    phone: "+211 922 481 003",
    event: "Juba Music Festival 2025",
    lastActive: "2 min ago",
    scansToday: 412,
    status: "Active",
  },
  {
    id: 2,
    name: "Rebecca Aluel",
    phone: "+211 955 102 778",
    event: "Juba Music Festival 2025",
    lastActive: "just now",
    scansToday: 388,
    status: "Active",
  },
  {
    id: 3,
    name: "Daniel Garang",
    phone: "+211 928 640 219",
    event: "Juba Music Festival 2025",
    lastActive: "3 days ago",
    scansToday: 0,
    status: "Inactive",
  },
  {
    id: 4,
    name: "Mary Nyibol",
    phone: "+211 911 305 884",
    event: "SSPL Final",
    lastActive: "1 hr ago",
    scansToday: 96,
    status: "Active",
  },
];

export const AGENT_SCAN_HISTORY: AgentScanHistoryRecord[] = [
  {
    time: "19:42:08",
    event: "Juba Music Festival",
    result: "ADMIT",
    id: "TIX-7K2M-9QX4",
  },
  {
    time: "19:41:30",
    event: "Juba Music Festival",
    result: "ADMIT",
    id: "TIX-3P9L-1ZK8",
  },
  {
    time: "19:40:55",
    event: "Juba Music Festival",
    result: "REJECT",
    id: "TIX-2M4N-7TT0",
  },
  {
    time: "19:40:11",
    event: "Juba Music Festival",
    result: "ADMIT",
    id: "TIX-8W1C-4MM2",
  },
  {
    time: "19:39:47",
    event: "Juba Music Festival",
    result: "ADMIT",
    id: "TIX-5R6B-0QP5",
  },
  {
    time: "19:39:02",
    event: "Juba Music Festival",
    result: "REJECT",
    id: "TIX-1A5C-3RX9",
  },
  {
    time: "19:38:20",
    event: "Juba Music Festival",
    result: "ADMIT",
    id: "TIX-9X2D-8WB1",
  },
];

export const SYSTEM_HEALTH: SystemHealthData = {
  uptime: "99.7%",
  responseTime: "1.4s",
  failedCallbacks: 2,
  services: [
    { name: "Africa's Talking SMS", status: "Operational", checked: "30s ago" },
    {
      name: "Africa's Talking USSD",
      status: "Operational",
      checked: "30s ago",
    },
    { name: "MTN Mobile Money API", status: "Operational", checked: "45s ago" },
    { name: "Airtel Money API", status: "Degraded", checked: "1 min ago" },
    { name: "PostgreSQL Database", status: "Operational", checked: "20s ago" },
    { name: "Redis Cache", status: "Operational", checked: "20s ago" },
    {
      name: "DigitalOcean Spaces",
      status: "Operational",
      checked: "1 min ago",
    },
  ],
  errors: [
    {
      time: "13:42:08",
      service: "Airtel Money API",
      code: "ETIMEDOUT",
      message: "Callback timed out after 30s",
      resolved: false,
    },
    {
      time: "11:20:51",
      service: "Africa's Talking SMS",
      code: "429",
      message: "Rate limit exceeded, retried",
      resolved: true,
    },
    {
      time: "08:05:33",
      service: "MTN Mobile Money API",
      code: "503",
      message: "Upstream temporarily unavailable",
      resolved: true,
    },
  ],
};

// ============================================================
// EXPLORE — public discovery page data
// ============================================================
export const EXPLORE_POSTERS: Record<string, string> = {
  Music: "linear-gradient(157deg, #3a1d6e 0%, #241a52 45%, #0b1f3a 100%)",
  Sports: "linear-gradient(157deg, #0f5132 0%, #0c3a2a 48%, #08283B 100%)",
  Conference: "linear-gradient(157deg, #283545 0%, #313d4d 48%, #16181c 100%)",
  Church: "linear-gradient(157deg, #5b1626 0%, #3a1320 48%, #0b1f3a 100%)",
  Graduation: "linear-gradient(157deg, #7a5e16 0%, #4f421d 45%, #0b2236 110%)",
  "Food & Drinks":
    "linear-gradient(157deg, #7a3b12 0%, #5a2f14 48%, #0b1f3a 100%)",
  "Arts & Culture":
    "linear-gradient(157deg, #155e63 0%, #123f4f 48%, #08283B 100%)",
};

export const EXPLORE_EVENTS: ExploreEventType[] = [
  {
    id: "x-jmf",
    title: "Juba Music Festival 2025",
    category: "Music",
    venue: "Juba Stadium",
    city: "Juba",
    price: 14,
    status: "happening-now",
    times: ["happening-now", "today"],
    sortKey: 1,
    organizer: "Nile Live Events",
    date: "Today",
    time: "18:00 – 23:00",
    about:
      "The biggest night of live music in South Sudan. Three stages, fifteen artists, and food vendors from across Juba. Gates open at 17:00.",
    image:
      "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600&q=80",
    tiers: [
      { id: "vip", name: "VIP", price: 35, remaining: 40 },
      { id: "gen", name: "General", price: 14, remaining: 1200 },
    ],
  },
  {
    id: "x-psl",
    title: "South Sudan Premier League Final",
    category: "Sports",
    venue: "Juba Stadium",
    city: "Juba",
    price: 5,
    status: "happening-now",
    times: ["happening-now", "today"],
    sortKey: 2,
    organizer: "SSFA",
    date: "Today",
    time: "16:00 kick-off",
    about:
      "The title decider. Defending champions face the league's top scorers. Turnstiles open two hours before kick-off.",
    image:
      "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=600&q=80",
    tiers: [
      { id: "vip", name: "VIP Stand", price: 20, remaining: 60 },
      { id: "gen", name: "General Stand", price: 5, remaining: 3400 },
    ],
  },
  {
    id: "x-gospel",
    title: "Sunday Gospel Celebration",
    category: "Church",
    venue: "Juba Cathedral",
    city: "Juba",
    price: 0,
    status: "happening-now",
    times: ["happening-now", "today", "weekend"],
    sortKey: 3,
    organizer: "Juba Cathedral",
    date: "Today",
    time: "10:00 – 13:00",
    about:
      "An open celebration of worship and gospel music. All are welcome. Free entry, seating first-come.",
    image:
      "https://images.unsplash.com/photo-1529154036614-a60975f5c760?w=600&q=80",
    tiers: [
      { id: "free", name: "General admission", price: 0, remaining: 800 },
    ],
  },
  {
    id: "x-grad",
    title: "University of Juba Graduation 2025",
    category: "Graduation",
    venue: "UoJ Main Hall",
    city: "Juba",
    price: 0,
    status: "upcoming",
    times: ["weekend", "tomorrow", "month"],
    sortKey: 4,
    organizer: "University of Juba",
    date: "Sat 21 Jun 2025",
    time: "09:00",
    about:
      "The 2025 commencement ceremony. Each graduand is allocated guest tickets. Doors close promptly at 08:45.",
    image:
      "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=600&q=80",
    tiers: [{ id: "fam", name: "Family Guest", price: 0, remaining: 140 }],
  },
  {
    id: "x-biz",
    title: "Juba International Business Conference",
    category: "Conference",
    venue: "Radisson Juba",
    city: "Juba",
    price: 25,
    status: "upcoming",
    times: ["month"],
    sortKey: 6,
    organizer: "SS Chamber of Commerce",
    date: "Mon 23 Jun 2025",
    time: "08:30 – 17:00",
    about:
      "A full-day gathering of founders, investors, and policymakers shaping South Sudan's economy. Includes lunch and a networking reception.",
    image:
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80",
    tiers: [
      { id: "del", name: "Delegate", price: 25, remaining: 120 },
      { id: "vip", name: "Executive", price: 60, remaining: 30 },
    ],
  },
  {
    id: "x-jazz",
    title: "Juba Jazz Evening",
    category: "Music",
    venue: "Eden Garden Juba",
    city: "Juba",
    price: 10,
    status: "upcoming",
    times: ["weekend", "month"],
    sortKey: 7,
    organizer: "Eden Garden",
    date: "Fri 27 Jun 2025",
    time: "19:00",
    about:
      "An intimate evening of live jazz under the Juba sky, with food and drinks available all night.",
    image:
      "https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=600&q=80",
    tiers: [
      { id: "gen", name: "General", price: 10, remaining: 400 },
      { id: "vip", name: "Lounge", price: 30, remaining: 50 },
    ],
  },
  {
    id: "x-sspl24",
    title: "SSPL Week 24 — FC Juba vs Atlabara",
    category: "Sports",
    venue: "Juba Stadium",
    city: "Juba",
    price: 3,
    status: "upcoming",
    times: ["weekend", "month"],
    sortKey: 8,
    organizer: "SSFA",
    date: "Sun 29 Jun 2025",
    time: "15:00 kick-off",
    about:
      "Matchweek 24 of the South Sudan Premier League. A local derby with everything to play for.",
    image:
      "https://images.unsplash.com/photo-1577223625816-7546f13df25d?w=600&q=80",
    tiers: [{ id: "gen", name: "General Stand", price: 3, remaining: 5000 }],
  },
  {
    id: "x-youth",
    title: "National Youth Leadership Summit",
    category: "Conference",
    venue: "UNMISS Hall",
    city: "Juba",
    price: 12,
    status: "upcoming",
    times: ["month"],
    sortKey: 9,
    organizer: "Ministry of Youth",
    date: "Tue 1 Jul 2025",
    time: "09:00 – 16:00",
    about:
      "Young leaders from across the ten states convene for a day of workshops, panels, and networking.",
    image:
      "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=600&q=80",
    tiers: [{ id: "gen", name: "Delegate", price: 12, remaining: 300 }],
  },
  {
    id: "x-food",
    title: "Juba Street Food Festival",
    category: "Food & Drinks",
    venue: "Freedom Square, Juba",
    city: "Juba",
    price: 5,
    status: "upcoming",
    times: ["weekend", "month"],
    sortKey: 10,
    organizer: "RwandanTechEvents",
    date: "Sat 5 Jul 2025",
    time: "12:00 – 22:00",
    about:
      "Fifty vendors, twelve cuisines, and live entertainment across two outdoor stages. Family-friendly, pet-friendly.",
    image:
      "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&q=80",
    tiers: [
      { id: "gen", name: "General Entry", price: 5, remaining: 2000 },
      { id: "vip", name: "VIP Lounge", price: 20, remaining: 80 },
    ],
  },
  {
    id: "x-arts",
    title: "South Sudan Arts & Culture Expo",
    category: "Arts & Culture",
    venue: "Nyakuron Cultural Centre",
    city: "Juba",
    price: 6,
    status: "upcoming",
    times: ["month"],
    sortKey: 11,
    organizer: "Ministry of Culture",
    date: "Wed 9 Jul 2025",
    time: "10:00 – 18:00",
    about:
      "A celebration of South Sudanese art, craft, and heritage. Featuring live weaving, painting, sculpture, and spoken word.",
    image:
      "https://images.unsplash.com/photo-1578926288207-32356e5e1b37?w=600&q=80",
    tiers: [
      { id: "gen", name: "General Admission", price: 6, remaining: 1500 },
    ],
  },
  {
    id: "x-prayer",
    title: "National Prayer & Revival Night",
    category: "Church",
    venue: "Dr. John Garang Mausoleum Grounds",
    city: "Juba",
    price: 0,
    status: "upcoming",
    times: ["month"],
    sortKey: 12,
    organizer: "National Council of Churches",
    date: "Fri 11 Jul 2025",
    time: "18:00 – 23:59",
    about:
      "An evening of prayer, worship, and revival music. Open to all faiths. Free entry. Bring your own seating.",
    image:
      "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=600&q=80",
    tiers: [{ id: "free", name: "Free entry", price: 0, remaining: 5000 }],
  },
];

export const EXPLORE_BY_ID: Record<string, ExploreEventType> =
  Object.fromEntries(EXPLORE_EVENTS.map((e) => [e.id, e]));

export const EXPLORE_CATEGORIES: string[] = [
  "All",
  "Music",
  "Sports",
  "Conference",
  "Graduation",
  "Church",
  "Food & Drinks",
  "Arts & Culture",
];

export const EXPLORE_TIMES: Array<{ id: string; label: string }> = [
  { id: "happening-now", label: "Happening Now" },
  { id: "today", label: "Today" },
  { id: "tomorrow", label: "Tomorrow" },
  { id: "weekend", label: "This Weekend" },
  { id: "month", label: "This Month" },
];

export const EXPLORE_CITIES: string[] = [
  "Juba",
  "Wau",
  "Malakal",
  "Yei",
  "All Cities",
];
