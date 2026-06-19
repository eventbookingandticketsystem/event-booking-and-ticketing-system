/**
 * Adapters — convert DB API shapes to the UI types that components consume.
 *
 * The DB returns raw data (ISO dates, null posters, etc.).
 * The UI components expect the mock-data shape (formatted dates, gradient strings).
 *
 * Centralising the conversion here means:
 *   • Components stay unchanged — they keep consuming EventType / TicketType
 *   • The mapping is auditable in one place
 *   • Types stay correct at every layer
 */

import type { EventType, TicketTier } from "@/types/event";
import type { TicketType, TicketStatus, TicketWhen, TicketEventSummary } from "@/types/ticket";
import type { ApiEvent, ApiTicket, ApiTicketTier } from "./types";
import { POSTERS } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";

// ─── Event adapter ────────────────────────────────────────────────────────────

function adaptTier(t: ApiTicketTier): TicketTier {
  return {
    id: t.id,
    name: t.name,
    price: t.price,
    capacity: t.capacity,
    remaining: t.remaining,
    soldOut: t.soldOut,
    lowStock: t.lowStock,
  };
}

/**
 * Pick a poster gradient for an event.
 * Priority: poster field from DB (if it looks like a gradient) → POSTERS lookup by category.
 */
function posterFor(event: ApiEvent): string {
  if (event.poster && event.poster.startsWith("linear-gradient")) {
    return event.poster;
  }
  const key = event.category.toLowerCase();
  return POSTERS[key] ?? POSTERS["conference"];
}

export function adaptEvent(e: ApiEvent): EventType {
  return {
    id: e.id,
    title: e.title,
    category: e.category,
    poster: posterFor(e),
    image: e.image ?? undefined,
    organizer: e.organizer,
    // formatDate handles ISO strings and falls back gracefully
    date: formatDate(e.date),
    time: e.time,
    venue: e.venue,
    featured: e.featured,
    about: e.description,
    tiers: e.tiers.map(adaptTier),
  };
}

export function adaptEvents(events: ApiEvent[]): EventType[] {
  return events.map(adaptEvent);
}

// ─── Ticket adapter ───────────────────────────────────────────────────────────

function apiStatusToUI(s: ApiTicket["status"]): TicketStatus {
  switch (s) {
    case "VALID":   return "Valid";
    case "USED":    return "Used";
    case "EXPIRED": return "Expired";
  }
}

function ticketWhen(t: ApiTicket): TicketWhen {
  // A ticket is "upcoming" if VALID and the event date is in the future.
  if (t.status !== "VALID") return "past";
  const eventDate = new Date(t.event.date);
  return eventDate > new Date() ? "upcoming" : "past";
}

export function adaptTicket(t: ApiTicket): TicketType {
  const eventSummary: TicketEventSummary = {
    id: t.event.id,
    title: t.event.title,
    // Format the ISO date for display — same formatDate used for events
    date: formatDate(t.event.date),
    venue: t.event.venue,
    category: t.event.category,
    poster: t.event.poster,
  };

  return {
    id: t.ticketRef,   // UI uses the human-readable ref (TIX-XXXX-XXXX)
    eventId: t.eventId,
    tier: t.tier,
    status: apiStatusToUI(t.status),
    when: ticketWhen(t),
    event: eventSummary,
  };
}

export function adaptTickets(tickets: ApiTicket[]): TicketType[] {
  return tickets.map(adaptTicket);
}
