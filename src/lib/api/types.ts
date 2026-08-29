/**
 * API response envelope types — matches api-utils.ts exactly.
 *
 *   ok(data)          → { success: true,  data, pagination?: undefined }
 *   paginated(...)    → { success: true,  data, pagination: { page, limit, total, totalPages } }
 *   error helpers     → { success: false, message }
 *
 * The axios interceptor in client.ts unwraps to ApiResponse<T>,
 * so hooks receive { data, pagination? } directly.
 */

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** What the interceptor resolves to after unwrapping the envelope. */
export interface ApiResponse<T> {
  data: T;
  pagination?: Pagination;
}

// ─── DB event shapes (what /api/events actually returns) ─────────────────────
// The DB model differs from the mock EventType:
//   • date is an ISO DateTime string, not pre-formatted
//   • time is a raw string ("6:00 PM – 11:00 PM")
//   • poster/image may be null
//   • tiers is a TicketTierRow[] from the DB select
//   • orgProfile is an object, not a flat organizer string

export interface ApiTicketTier {
  id: string;
  name: string;
  price: number;
  capacity: number;
  remaining: number;
  soldOut: boolean;
  lowStock: boolean;
}

export interface ApiOrgProfile {
  id: string;
  orgName: string;
  contactName: string;
}

/** Shape returned by GET /api/events (single item in the array) */
export interface ApiEvent {
  id: string;
  title: string;
  category: string;
  description: string;
  venue: string;
  city: string;
  date: string;          // ISO DateTime — "2025-12-14T18:00:00.000Z"
  time: string;          // raw time string
  organizer: string;     // denormalized organizer name
  featured: boolean;
  status: string;
  poster: string | null;
  image: string | null;
  about?: string;        // same as description, alias
  tiers: ApiTicketTier[];
  orgProfile: ApiOrgProfile;
  createdAt: string;
  updatedAt: string;
}

// ─── DB ticket shapes (what /api/tickets actually returns) ────────────────────

/** Shape returned by GET /api/tickets list (includes embedded event select) */
export interface ApiTicket {
  id: string;
  ticketRef: string;     // "TIX-XXXX-XXXX"
  qrPayload: string;     // "ticketRef:eventId:userId" — encoded in the QR image
  eventId: string;
  bookingId: string;
  tierId: string;
  ownerId: string;
  status: "VALID" | "USED" | "EXPIRED";
  /** Denormalized tier name at time of issue — DB field is `tier` */
  tier: string;
  issuedAt: string;
  usedAt: string | null;
  event: {
    id: string;
    title: string;
    date: string;
    venue: string;
    category: string;
    poster: string | null;
    city: string;
    organizer: string;
  };
}

// ─── Booking shapes ───────────────────────────────────────────────────────────

/** What POST /api/bookings returns on success */
export interface ApiBookingCreated {
  id: string;
  ref: string;               // "BKG-XXXXXXXX"
  userId: string;
  eventId: string;
  method: string;
  subtotal: number;
  serviceFee: number;
  total: number;
  status: string;            // "PENDING"
  createdAt: string;
  updatedAt: string;
  lines: Array<{
    id: string;
    tierId: string;
    qty: number;
    unitPrice: number;
    subtotal: number;
    tier: { id: string; name: string };
  }>;
  tickets: Array<{
    id: string;
    ticketRef: string;
    status: string;
    tier: string;
  }>;
  event: {
    id: string;
    title: string;
    date: string;
    venue: string;
  };
}

/** What PATCH /api/bookings/[id] returns */
export interface ApiBookingUpdated {
  id: string;
  ref: string;
  status: string;
  paidAt: string | null;
  total: number;
  updatedAt: string;
}

/** Richer shape returned by GET /api/tickets/[id] */
export interface ApiTicketDetail extends ApiTicket {
  tierModel: {
    id: string;
    name: string;
    price: number;
    capacity: number;
  } | null;
  booking: {
    id: string;
    ref: string;
    status: string;
    total: number;
    paidAt: string | null;
    method: string;
  } | null;
  scans: Array<{
    id: string;
    result: string;
    scannedAt: string;
    gate: string | null;
    note: string | null;
  }>;
}

// ─── Organizer shapes ─────────────────────────────────────────────────────────

/** One scan record in the dashboard's recent-scans list */
export interface ApiScanRecord {
  id: string;
  result: string;       // "ADMIT" | "REJECT" | "INVALID" | "USED" | etc.
  scannedAt: string;    // ISO DateTime
  gate: string | null;
  ticketRef: string | null;
}

/** One scan record from GET /api/agents/[id]/scans — includes the rejection reason */
export interface ApiAgentScanRecord {
  id:        string;
  result:    "ADMIT" | "ALREADY_USED" | "INVALID" | "WRONG_EVENT" | "EXPIRED";
  scannedAt: string;    // ISO DateTime
  gate:      string;
  ticketRef: string | null;
  note:      string | null;
}

/** Tier breakdown item returned by /api/organizer/dashboard */
export interface ApiTierBreakdown {
  name: string;
  capacity: number;
  sold: number;
  remaining: number;
  soldOut: boolean;
}

/** Shape returned by GET /api/organizer/dashboard */
export interface ApiOrgDashboard {
  eventId: string | null; // null when this is the "all events" aggregate
  eventName: string;
  admitted: number;
  capacity: number;
  sold: number;
  fraud: number;
  revenue: number;
  entryRate: Array<{ t: string; v: number }>;
  tiers: ApiTierBreakdown[];
  scans: ApiScanRecord[];
}

/** One row returned by GET /api/organizer/events */
export interface ApiOrgEvent {
  id: string;
  title: string;
  description: string | null;
  status: string;        // "DRAFT" | "PUBLISHED" | "ONGOING" | "COMPLETED" | "CANCELLED"
  date: string;          // ISO DateTime
  time: string;
  venue: string;
  city: string;
  category: string;
  organizer: string;
  poster: string | null; // CSS gradient string (rarely set in DB)
  image: string | null;  // Cloudinary photo URL uploaded by organizer
  tiers: Array<{
    id: string;
    name: string;
    price: number;
    capacity: number;
    remaining: number;
    soldOut: boolean;
    lowStock: boolean;
  }>;
  _count: {
    bookings: number;
    tickets: number;
    gateAgents: number;
  };
  createdAt: string;
  updatedAt: string;
}

/** Shape returned by POST /api/events (create event) */
export interface ApiCreatedEvent {
  id: string;
  title: string;
  status: string;
  date: string;
  time: string;
  venue: string;
  city: string;
  category: string;
  organizer: string;
  poster: string | null;
  image: string | null;
  tiers: Array<{
    id: string;
    name: string;
    price: number;
    capacity: number;
    remaining: number;
    soldOut: boolean;
    lowStock: boolean;
  }>;
  createdAt: string;
  updatedAt: string;
}

// ─── Gate agent shapes ────────────────────────────────────────────────────────

/** One gate agent row from GET /api/agents */
export interface ApiGateAgent {
  id: string;
  name: string;
  phone: string;
  gate: string;
  status: string;        // "ACTIVE" | "INACTIVE"
  eventId: string;
  userId: string | null;
  /** Number of admissions today (incremented on ADMIT result) */
  scansToday: number;
  lastActiveAt: string | null;
  createdAt: string;
  updatedAt: string;
  event: {
    id: string;
    title: string;
    date: string;        // ISO DateTime
  };
}

/** Shape returned by POST /api/agents (includes one-time generated password) */
export interface ApiCreatedAgent extends ApiGateAgent {
  generatedPassword: string;
}

// ─── Current user / profile shapes ───────────────────────────────────────────

/** Shape returned by GET /api/auth/me */
export interface ApiCurrentUser {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  role: string;
  image: string | null;
  createdAt: string;
  updatedAt: string;
  orgProfile: {
    id: string;
    orgName: string;
    contactName: string;
    website: string | null;
    description: string | null;
  } | null;
  agentProfile: {
    id: string;
    badge: string | null;
  } | null;
}

/** Shape returned by PATCH /api/auth/me */
export interface ApiUpdatedUser {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  role: string;
  image: string | null;
  updatedAt: string;
}

// ─── Admin shapes ─────────────────────────────────────────────────────────────

/** Shape returned by GET /api/admin/stats */
export interface ApiAdminStats {
  totalOrganizers: number;
  activeToday:     number;   // events with status ONGOING right now
  activeEvents:    number;   // published/ongoing events today or in the future
  totalEvents:     number;   // every event on the platform, any status
  ticketsAllTime:  number;
  fraud30d:        number;   // rejected scans in last 30 days
  salesTrend:      Array<{ t: string; v: number }>;  // last 14 days, "Jun 05" → count
}

/** One user row from GET /api/admin/users or GET /api/admin/users/[id] */
export interface ApiAdminUser {
  id:         string;
  name:       string | null;
  email:      string | null;
  phone:      string | null;
  role:       string;        // "ATTENDEE" | "ORGANIZER" | "GATE_AGENT" | "ADMIN"
  image:      string | null;
  createdAt:  string;
  updatedAt:  string;
  orgProfile?: {
    id:          string;
    orgName:     string;
    contactName: string;
    status?:     string;   // "Active" | "Suspended"
    website?:    string | null;
    description?: string | null;
  } | null;
  agentProfile?: {
    id:    string;
    badge: string | null;
  } | null;
}

// ─── My bookings (wallet) shapes ─────────────────────────────────────────────

/** One booking row from GET /api/bookings/mine */
export interface ApiMyBooking {
  id:         string;
  ref:        string;
  status:     "PENDING" | "CONFIRMED" | "FAILED" | "EXPIRED" | "REFUNDED";
  method:     string;          // "MTN" | "AIRTEL" | "CASH"
  subtotal:   number;
  serviceFee: number;
  total:      number;
  paidAt:     string | null;
  createdAt:  string;
  updatedAt:  string;
  event: {
    id:       string;
    title:    string;
    date:     string;          // ISO DateTime
    venue:    string;
    category: string;
    poster:   string | null;
    city:     string;
  };
  lines: Array<{
    id:        string;
    qty:       number;
    unitPrice: number;
    subtotal:  number;
    tier: { id: string; name: string };
  }>;
  tickets: Array<{
    id:        string;
    ticketRef: string;
    status:    string;
    tier:      string;
  }>;
}

// ─── Organizer reports shapes ─────────────────────────────────────────────────

/** Shape returned by GET /api/organizer/reports */
export interface ApiOrgReport {
  eventName: string;
  attended:  number;
  revenue:   number;
  fraud:     number;
  duration:  string;            // e.g. "2h 15m" | "—"
  entryRate: Array<{ t: string; v: number }>;
  tiers: Array<{
    name:      string;
    capacity:  number;
    sold:      number;
    remaining: number;
    soldOut:   boolean;
  }>;
  fraudRows: Array<{
    time:      string;
    gate:      string;
    reason:    string;
    ticketRef: string;
  }>;
}

/** One event row from GET /api/admin/events — includes orgProfile nested */
export interface ApiAdminEvent {
  id:          string;
  title:       string;
  description: string | null;
  venue:       string;
  city:        string;
  date:        string;       // ISO DateTime
  time:        string;
  category:    string;
  poster:      string | null;
  status:      string;       // "DRAFT" | "PUBLISHED" | "ONGOING" | "COMPLETED" | "CANCELLED"
  flagged:     boolean;
  organizer:   string;
  orgProfileId: string;
  createdAt:   string;
  updatedAt:   string;
  orgProfile:  {
    id:          string;
    orgName:     string;
    contactName: string;
  };
  _count: {
    tiers:    number;
    bookings: number;
    tickets:  number;
  };
}
