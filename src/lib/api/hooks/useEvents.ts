import { useQuery } from "@tanstack/react-query";
import apiClient from "../client";
import { adaptEvents } from "../adapters";
import type { ApiResponse, ApiEvent } from "../types";
import type { EventType } from "@/types/event";

export interface UseEventsParams {
  featured?: boolean;
  category?: string;
  search?: string;
  city?: string;
  status?: string;
  page?: number;
  limit?: number;
}

/**
 * Fetch the public event list from GET /api/events.
 *
 * Returns adapted EventType[] so components need no changes.
 * Query key includes all params — any filter change triggers a refetch.
 */
export function useEvents(params: UseEventsParams = {}) {
  return useQuery<EventType[]>({
    queryKey: ["events", params] as const,
    queryFn: async () => {
      // Build query string — omit undefined/empty values
      const searchParams = new URLSearchParams();
      if (params.featured !== undefined)
        searchParams.set("featured", String(params.featured));
      if (params.category)  searchParams.set("category",  params.category);
      if (params.search)    searchParams.set("search",    params.search);
      if (params.city)      searchParams.set("city",      params.city);
      if (params.status)    searchParams.set("status",    params.status);
      if (params.page)      searchParams.set("page",      String(params.page));
      if (params.limit)     searchParams.set("limit",     String(params.limit));

      const qs = searchParams.toString();
      const url = qs ? `/events?${qs}` : "/events";

      const response = await apiClient.get<ApiResponse<ApiEvent[]>>(url);
      return adaptEvents(response.data.data);
    },
  });
}
