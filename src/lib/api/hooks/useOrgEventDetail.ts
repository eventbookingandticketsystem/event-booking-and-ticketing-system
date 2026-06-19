import { useQuery } from "@tanstack/react-query";
import apiClient from "../client";
import type { ApiResponse, ApiOrgEvent } from "../types";
import { formatDate } from "@/lib/utils";
import { POSTERS } from "@/lib/mock-data";
import type { TicketTier } from "@/types/event";

/**
 * Adapted event detail for the organizer event-detail page.
 * Richer than OrgEventRow — includes tiers with full fields.
 */
export interface OrgEventDetail {
  id: string;
  name: string;
  title: string;
  status: string;
  date: string;          // formatted: "Sat, 14 Dec 2026"
  rawDate: string;       // YYYY-MM-DD — for date input pre-fill
  time: string;
  venue: string;
  city: string;
  category: string;
  organizer: string;
  poster: string;        // gradient from POSTERS — always present as fallback
  image: string | null;  // Cloudinary URL (null if no photo uploaded)
  description: string;
  sold: number;
  capacity: number;
  tiers: TicketTier[];
  agentCount: number;
}

function adaptStatus(s: string): string {
  switch (s) {
    case "DRAFT":      return "Draft";
    case "PUBLISHED":  return "Published";
    case "ONGOING":    return "Ongoing";
    case "COMPLETED":  return "Completed";
    case "CANCELLED":  return "Completed";
    default:           return "Upcoming";
  }
}

/** Pick a gradient poster by category, falling back to the first defined poster. */
function posterForCategory(category: string, apiPoster: string | null): string {
  if (apiPoster) return apiPoster;
  const key = category.toLowerCase() as keyof typeof POSTERS;
  return POSTERS[key] ?? POSTERS.concert;
}

export function adaptOrgEventDetail(e: ApiOrgEvent): OrgEventDetail {
  const sold     = e.tiers.reduce((s, t) => s + (t.capacity - t.remaining), 0);
  const capacity = e.tiers.reduce((s, t) => s + t.capacity, 0);

  // Extract YYYY-MM-DD for the date input element
  const rawDate = e.date ? e.date.slice(0, 10) : "";

  return {
    id:          e.id,
    name:        e.title,
    title:       e.title,
    status:      adaptStatus(e.status),
    date:        formatDate(e.date),
    rawDate,
    time:        e.time,
    venue:       e.venue,
    city:        e.city,
    category:    e.category,
    organizer:   e.organizer,
    poster:      posterForCategory(e.category, null),  // gradient fallback
    image:       e.poster,                             // Cloudinary URL (or null)
    description: "",    // ApiOrgEvent doesn't include description — shown as empty
    sold,
    capacity,
    tiers: e.tiers.map((t) => ({
      id:        t.id,
      name:      t.name,
      price:     t.price,
      capacity:  t.capacity,
      remaining: t.remaining,
      soldOut:   t.soldOut,
      lowStock:  t.lowStock,
    })),
    agentCount:  e._count.gateAgents,
  };
}

/**
 * GET /api/organizer/events — fetch a single event by id.
 *
 * The organizer events list returns all events; we filter client-side
 * by id. This avoids a separate route and reuses the same cache key.
 */
export function useOrgEventDetail(eventId: string) {
  return useQuery<OrgEventDetail>({
    queryKey: ["org-event-detail", eventId] as const,
    enabled:  !!eventId,
    queryFn:  async () => {
      // Fetch all org events and find the matching one.
      // In a larger system this would be a dedicated /api/organizer/events/:id,
      // but the org typically has <50 events so this is efficient.
      const res = await apiClient.get<ApiResponse<ApiOrgEvent[]>>(
        "/organizer/events?limit=50",
      );
      const event = res.data.data.find((e) => e.id === eventId);
      if (!event) throw new Error("Event not found");
      return adaptOrgEventDetail(event);
    },
  });
}
