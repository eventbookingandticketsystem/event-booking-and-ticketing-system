// Ticket-related TypeScript interfaces
// Source of truth: design-reference/.../js/data.jsx MY_TICKETS array

export type TicketStatus = "Valid" | "Used" | "Expired";
export type TicketWhen   = "upcoming" | "past";

/** Minimal event fields embedded on each ticket — sourced from ApiTicket.event */
export interface TicketEventSummary {
  id: string;
  title: string;
  date: string;         // formatted for display — adapter converts ISO → "10 Dec 2026"
  venue: string;
  category: string;
  poster: string | null;  // CSS gradient string (always set by adapter)
  image?: string;         // Cloudinary photo URL (optional)
}

export interface TicketType {
  id: string;        // "TIX-7K2M-9QX4"
  eventId: string;   // references EventType.id
  tier: string;      // tier name, e.g. "VIP"
  status: TicketStatus;
  when: TicketWhen;
  /** Embedded event summary from the API — populated by adaptTicket(). */
  event?: TicketEventSummary;
}
