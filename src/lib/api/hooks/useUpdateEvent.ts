import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../client";
import type { ApiResponse, ApiEvent } from "../types";

export interface UpdateEventInput {
  title?:       string;
  description?: string;
  venue?:       string;
  city?:        string;
  date?:        string;   // ISO datetime
  time?:        string;
  category?:    string;
  poster?:      string;
  image?:       string;
  status?:      "DRAFT" | "PUBLISHED" | "ONGOING" | "COMPLETED" | "CANCELLED";
}

/** PUT /api/events/[id] — partial update (ORGANIZER owner or ADMIN) */
export function useUpdateEvent(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation<ApiEvent, Error, UpdateEventInput>({
    mutationFn: async (input) => {
      const res = await apiClient.put<ApiResponse<ApiEvent>>(
        `/events/${encodeURIComponent(eventId)}`,
        input,
      );
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org-events"] });
      queryClient.invalidateQueries({ queryKey: ["org-event-detail", eventId] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["explore-events"] });
    },
  });
}

/** DELETE /api/events/[id] — soft-cancels the event (sets status=CANCELLED) */
export function useDeleteEvent(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, void>({
    mutationFn: async () => {
      await apiClient.delete(`/events/${encodeURIComponent(eventId)}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org-events"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["explore-events"] });
    },
  });
}
