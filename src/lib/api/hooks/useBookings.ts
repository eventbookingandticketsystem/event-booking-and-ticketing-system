import { useQuery } from "@tanstack/react-query";
import apiClient from "../client";
import type { ApiResponse, ApiMyBooking } from "../types";

/**
 * Fetches all bookings for the authenticated user.
 * Returns every booking status (CONFIRMED, PENDING, FAILED, EXPIRED)
 * so the wallet can show retry / view-QR CTAs per booking.
 */
export function useBookings() {
  return useQuery<ApiMyBooking[]>({
    queryKey: ["bookings", "mine"] as const,
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<ApiMyBooking[]>>(
        "/bookings/mine",
      );
      return res.data.data;
    },
  });
}
