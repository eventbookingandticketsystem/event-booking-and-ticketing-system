import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../client";
import type { ApiResponse, ApiBookingUpdated } from "../types";

/**
 * PATCH /api/bookings/[id] — confirm payment for a pending booking.
 *
 * On success:
 *   • invalidates ["tickets"] so the wallet shows VALID status immediately
 *
 * The mutation variable is the booking DB id (not the ref).
 */
export function useConfirmPayment() {
  const queryClient = useQueryClient();

  return useMutation<ApiBookingUpdated, Error, string>({
    mutationFn: async (bookingId: string) => {
      const response = await apiClient.patch<ApiResponse<ApiBookingUpdated>>(
        `/bookings/${encodeURIComponent(bookingId)}`,
        { status: "CONFIRMED" },
      );
      return response.data.data;
    },
    onSuccess: () => {
      // Wallet now shows ticket as confirmed
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
  });
}
