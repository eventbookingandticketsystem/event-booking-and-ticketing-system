import { useQuery } from "@tanstack/react-query";
import apiClient from "../client";
import { adaptEvent } from "../adapters";
import type { ApiResponse, ApiEvent } from "../types";
import type { EventType } from "@/types/event";

/**
 * Fetch a single event by its DB id from GET /api/events/[id].
 * Returns an adapted EventType so the detail page needs no changes.
 */
export function useEvent(eventId: string) {
  return useQuery<EventType>({
    queryKey: ["event", eventId] as const,
    enabled: !!eventId,
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<ApiEvent>>(
        `/events/${encodeURIComponent(eventId)}`,
      );
      return adaptEvent(response.data.data);
    },
  });
}
