import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../client";
import type { ApiResponse, ApiBookingCreated } from "../types";

export interface BookingLine {
  tierId: string;
  qty: number;
}

export interface CreateBookingInput {
  eventId: string;
  lines: BookingLine[];
  method: "MTN" | "AIRTEL" | "CASH" | "CARD";
}

/**
 * POST /api/bookings — create a booking for the authenticated user.
 *
 * On success:
 *   • invalidates ["tickets"] so the wallet refreshes
 *   • invalidates ["event", eventId] so tier remaining counts update
 *
 * The mutation error message comes directly from the server
 * (over-capacity, sold-out, etc.) via the axios interceptor.
 */
export function useCreateBooking() {
  const queryClient = useQueryClient();

  return useMutation<ApiBookingCreated, Error, CreateBookingInput>({
    mutationFn: async (input) => {
      const response = await apiClient.post<ApiResponse<ApiBookingCreated>>(
        "/bookings",
        input,
      );
      return response.data.data;
    },
    onSuccess: (data) => {
      // Refresh ticket wallet
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      // Refresh the event's tier remaining counts
      queryClient.invalidateQueries({ queryKey: ["event", data.eventId] });
      // Also invalidate the events list (featured card on dashboard)
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
}
