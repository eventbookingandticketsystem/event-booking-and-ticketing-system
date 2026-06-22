import { useQuery } from "@tanstack/react-query";
import apiClient from "../client";
import type { ApiResponse, ApiOrgEvent } from "../types";
import type { OrgEventRow } from "@/types/event";
import { formatDate } from "@/lib/utils";
import { categoryGradient } from "@/lib/category-gradient";

/**
 * Map the API DB status strings → the UI OrgEventRow status.
 *
 * DB:  DRAFT | PUBLISHED | ONGOING | COMPLETED | CANCELLED
 * UI:  Draft | Published | Upcoming | Ongoing | Completed
 */
function adaptStatus(
  s: string,
): OrgEventRow["status"] {
  switch (s) {
    case "DRAFT":      return "Draft";
    case "PUBLISHED":  return "Published";
    case "ONGOING":    return "Ongoing";
    case "COMPLETED":  return "Completed";
    case "CANCELLED":  return "Completed";   // treat cancelled as completed for display
    default:           return "Upcoming";
  }
}

export function adaptOrgEvent(e: ApiOrgEvent): OrgEventRow {
  const sold     = e.tiers.reduce((sum, t) => sum + (t.capacity - t.remaining), 0);
  const capacity = e.tiers.reduce((sum, t) => sum + t.capacity, 0);
  // Gradient poster by category — fallback when no Cloudinary image uploaded
  const poster = categoryGradient(e.category);

  return {
    id:       e.id,
    name:     e.title,
    date:     formatDate(e.date),
    venue:    e.venue,
    sold,
    capacity,
    status:   adaptStatus(e.status),
    category: e.category,
    image:    e.image,   // Cloudinary URL (null if not uploaded)
    poster,               // gradient CSS string (always present)
  };
}

export interface UseOrgEventsParams {
  status?: string;
  page?:   number;
  limit?:  number;
}

/**
 * GET /api/organizer/events — ORGANIZER only.
 *
 * Returns adapted OrgEventRow[] matching the shape the events table expects.
 */
export function useOrgEvents(params: UseOrgEventsParams = {}) {
  return useQuery<OrgEventRow[]>({
    queryKey: ["org-events", params] as const,
    queryFn:  async () => {
      const sp = new URLSearchParams();
      if (params.status) sp.set("status", params.status);
      if (params.page)   sp.set("page",   String(params.page));
      if (params.limit)  sp.set("limit",  String(params.limit));

      const qs = sp.toString();
      const url = qs ? `/organizer/events?${qs}` : "/organizer/events";

      const response = await apiClient.get<ApiResponse<ApiOrgEvent[]>>(url);
      return response.data.data.map(adaptOrgEvent);
    },
  });
}
