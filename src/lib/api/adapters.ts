/**
 * Adapters — convert DB API shapes to the UI types that components consume.
 *
 * The DB returns raw data (ISO dates, null images, etc.).
 * The UI components expect the mock-data shape (formatted dates, gradient strings).
 *
 * Centralising the conversion here means:
 *   • Components stay unchanged — they keep consuming EventType / TicketType
 *   • The mapping is auditable in one place
 *   • Types stay correct at every layer
 *
 * DB field mapping:
 *   event.image  → Cloudinary photo URL uploaded by organizer (null if not uploaded)
 *   event.poster → CSS gradient string (null in practice; we derive it from category)
 */

import type { EventType, TicketTier } from "@/types/event";
import type { TicketType, TicketStatus, TicketWhen, TicketEventSummary } from "@/types/ticket";
import type { ApiEvent, ApiTicket, ApiTicketTier } from "./types";
import { categoryGradient } from "@/lib/category-gradient";
import { formatDate } from "@/lib/utils";

// ─── Event adapter ────────────────────────────────────────────────────────────

function adaptTier(t: ApiTicketTier): TicketTier {
  return {
    id:        t.id,
    name:      t.name,
    price:     t.price,
    capacity:  t.capacity,
    remaining: t.remaining,
    soldOut:   t.soldOut,
    lowStock:  t.lowStock,
  };
}

export function adaptEvent(e: ApiEvent): EventType {
  return {
    id:        e.id,
    title:     e.title,
    category:  e.category,
    // `poster` is always the CSS gradient — used as a background color fallback.
    poster:    categoryGradient(e.category),
    // `image` is the Cloudinary URL the organizer uploaded (null = no upload → no photo shown).
    image:     e.image ?? undefined,
    organizer: e.organizer,
    date:      formatDate(e.date),
    time:      e.time,
    venue:     e.venue,
    featured:  e.featured,
    about:     e.description,
    tiers:     e.tiers.map(adaptTier),
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
    id:       t.event.id,
    title:    t.event.title,
    date:     formatDate(t.event.date),
    venue:    t.event.venue,
    category: t.event.category,
    poster:   categoryGradient(t.event.category),
    // `t.event.poster` in the DB is the Cloudinary URL (confusingly named — see schema)
    // but `ApiTicket.event` exposes it as `poster`. Pass it through as `image`.
    image:    t.event.poster ?? undefined,
  };

  return {
    id:      t.ticketRef,
    eventId: t.eventId,
    tier:    t.tier,
    status:  apiStatusToUI(t.status),
    when:    ticketWhen(t),
    event:   eventSummary,
  };
}

export function adaptTickets(tickets: ApiTicket[]): TicketType[] {
  return tickets.map(adaptTicket);
}
