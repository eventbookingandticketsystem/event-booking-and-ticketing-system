import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../client";
import type { ApiResponse, ApiCreatedEvent } from "../types";

export interface CreateEventTierInput {
  name:       string;
  price:      number;
  capacity:   number;
  saleOpens?: string;   // ISO datetime or undefined
  saleCloses?: string;  // ISO datetime or undefined
}

export interface CreateEventInput {
  title:       string;
  description?: string;
  venue:       string;
  city?:       string;
  date:        string;  // ISO datetime — "2026-12-14T18:00:00.000Z"
  time:        string;
  category:    string;
  poster?:     string;
  image?:      string;   // Cloudinary secure_url
  status?:     "DRAFT" | "PUBLISHED";
  tiers:       CreateEventTierInput[];
}

/**
 * POST /api/events — create a new event (ORGANIZER only).
 *
 * On success:
 *   • invalidates ["org-events"] so the events list refreshes
 *   • invalidates ["events"] so the attendee discovery page shows the new event
 */
export function useCreateEvent() {
  const queryClient = useQueryClient();

  return useMutation<ApiCreatedEvent, Error, CreateEventInput>({
    mutationFn: async (input) => {
      const response = await apiClient.post<ApiResponse<ApiCreatedEvent>>(
        "/events",
        input,
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org-events"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["explore-events"] });
    },
  });
}
