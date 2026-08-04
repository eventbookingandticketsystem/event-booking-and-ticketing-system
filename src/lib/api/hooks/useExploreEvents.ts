import { useQuery } from "@tanstack/react-query";
import apiClient from "../client";
import type { ApiResponse, ApiEvent } from "../types";
import type { ExploreEventType, ExploreStatus, ExploreTier } from "@/types/event";
import { formatDate } from "@/lib/utils";

export interface UseExploreEventsParams {
  category?: string;
  search?: string;
  city?: string;
  /** "happening-now" | "today" | "tomorrow" | "weekend" | "month" */
  timeFilter?: string;
  limit?: number;
}

/** Derive explore status from DB event status + date */
function toExploreStatus(dbStatus: string, dateIso: string): ExploreStatus {
  if (dbStatus === "LIVE" || dbStatus === "ONGOING") return "happening-now";
  const eventDate = new Date(dateIso);
  const now = new Date();
  // If the date is today or in the past but not explicitly closed → treat as happening
  if (
    eventDate.toDateString() === now.toDateString() &&
    dbStatus === "PUBLISHED"
  ) {
    return "happening-now";
  }
  return "upcoming";
}

/** Build the times[] filter-key array used by the explore page */
function toTimeKeys(dateIso: string, status: ExploreStatus): string[] {
  const keys: string[] = [];
  if (status === "happening-now") keys.push("happening-now");

  const eventDate = new Date(dateIso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const evDay = new Date(
    eventDate.getFullYear(),
    eventDate.getMonth(),
    eventDate.getDate(),
  );

  // Today — includes happening-now events
  if (evDay.getTime() === today.getTime() || status === "happening-now") {
    keys.push("today");
  }

  // Tomorrow
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  if (evDay.getTime() === tomorrow.getTime()) keys.push("tomorrow");

  // This Weekend — Saturday and Sunday of the current week
  const dayOfWeek = today.getDay(); // 0=Sun, 6=Sat
  const daysToSat = dayOfWeek === 6 ? 0 : (6 - dayOfWeek);
  const thisSat = new Date(today);
  thisSat.setDate(today.getDate() + daysToSat);
  const thisSun = new Date(thisSat);
  thisSun.setDate(thisSat.getDate() + 1);
  if (evDay.getTime() === thisSat.getTime() || evDay.getTime() === thisSun.getTime()) {
    keys.push("weekend");
  }

  // This Month — same calendar month and year
  if (
    evDay.getFullYear() === today.getFullYear() &&
    evDay.getMonth() === today.getMonth() &&
    evDay >= today
  ) {
    keys.push("month");
  }

  return keys;
}

function adaptToExplore(e: ApiEvent): ExploreEventType {
  const status = toExploreStatus(e.status, e.date);
  const times = toTimeKeys(e.date, status);
  const minPrice =
    e.tiers.length > 0 ? Math.min(...e.tiers.map((t) => t.price)) : 0;
  const tiers: ExploreTier[] = e.tiers.map((t) => ({
    id: t.id,
    name: t.name,
    price: t.price,
    remaining: t.remaining,
  }));

  return {
    id: e.id,
    title: e.title,
    category: e.category,
    venue: e.venue,
    city: e.city,
    price: minPrice,
    status,
    times,
    sortKey: new Date(e.date).getTime(),
    organizer: e.organizer,
    date: formatDate(e.date),
    time: e.time,
    about: e.description,
    tiers,
    image: e.image ?? undefined,
  };
}

/**
 * Fetch events for the public explore page from GET /api/events.
 * Returns ExploreEventType[] — the shape ExploreCard and the detail page expect.
 */
export function useExploreEvents(params: UseExploreEventsParams = {}) {
  return useQuery<ExploreEventType[]>({
    queryKey: ["explore-events", params] as const,
    queryFn: async () => {
      const sp = new URLSearchParams();
      if (params.category && params.category !== "All")
        sp.set("category", params.category);
      if (params.search) sp.set("search", params.search);
      if (params.city && params.city !== "All Cities")
        sp.set("city", params.city);
      sp.set("limit", String(params.limit ?? 50));
      // Do not pass a status filter here — let the API default (excludes CANCELLED only)
      // so PUBLISHED, ONGOING, and LIVE events all appear.

      const qs = sp.toString();
      const url = qs ? `/events?${qs}` : "/events";
      const res = await apiClient.get<ApiResponse<ApiEvent[]>>(url);
      return (res.data.data ?? []).map(adaptToExplore);
    },
    staleTime: 30_000,
  });
}

/**
 * Fetch a single event for the public explore detail page.
 * Returns ExploreEventType directly so the detail page needs no adapter.
 */
export function useExploreEvent(eventId: string) {
  return useQuery<ExploreEventType>({
    queryKey: ["explore-event", eventId] as const,
    enabled: !!eventId,
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<ApiEvent>>(
        `/events/${encodeURIComponent(eventId)}`,
      );
      return adaptToExplore(res.data.data);
    },
  });
}
