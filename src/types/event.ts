// Event-related TypeScript interfaces
// Source of truth: design-reference/.../js/data.jsx EVENTS array

export interface TicketTier {
  id: string;
  name: string;
  price: number;       // SSP
  capacity: number;
  remaining: number;
  lowStock?: boolean;
  soldOut?: boolean;
}

export interface EventType {
  id: string;
  title: string;
  category: string;   // "Concert" | "Football" | "Conference" | "Graduation"
  poster: string;     // CSS gradient string
  image?: string;     // optional photo URL (Unsplash etc.)
  organizer: string;
  date: string;       // "Sat, 14 Dec 2025"
  time: string;       // "6:00 PM – 11:00 PM"
  venue: string;
  featured?: boolean;
  about: string;
  tiers: TicketTier[];
}

// Explore events (public discovery page) — richer shape than main EVENTS
export interface ExploreTier {
  id: string;
  name: string;
  price: number;
  remaining: number;
}

export type ExploreStatus = "happening-now" | "upcoming";

export interface ExploreEventType {
  id: string;
  title: string;
  category: string;
  venue: string;
  city: string;
  price: number;         // min price (0 = free)
  status: ExploreStatus;
  times: string[];       // filter keys: "happening-now", "today", "weekend", etc.
  sortKey: number;
  organizer: string;
  date: string;
  time: string;
  about: string;
  tiers: ExploreTier[];
  image?: string;        // optional photo URL (Unsplash etc.)
}

// Organizer events table row (ORG_EVENTS)
export interface OrgEventRow {
  id: string;
  name: string;
  date: string;
  venue: string;
  sold: number;
  capacity: number;
  status: "Ongoing" | "Upcoming" | "Completed" | "Draft" | "Published";
  category: string;
  image: string | null;   // Cloudinary URL or null (uses poster gradient as fallback)
  poster: string;         // CSS gradient string (always present)
}

// Admin all-events table row (ALL_EVENTS)
export interface AdminEventRow {
  id: string;
  name: string;
  organizer: string;
  date: string;
  sold: number;
  fraud: number;
  flagged: boolean;
  status: "Ongoing" | "Upcoming" | "Completed" | "Draft";
}
