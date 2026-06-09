// Ticket-related TypeScript interfaces
// Source of truth: design-reference/.../js/data.jsx MY_TICKETS array

export type TicketStatus = "Valid" | "Used" | "Expired";
export type TicketWhen   = "upcoming" | "past";

export interface TicketType {
  id: string;        // "TIX-7K2M-9QX4"
  eventId: string;   // references EventType.id
  tier: string;      // tier name, e.g. "VIP"
  status: TicketStatus;
  when: TicketWhen;
}
