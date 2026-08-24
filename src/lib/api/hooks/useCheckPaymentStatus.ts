import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../client";
import type { ApiResponse } from "../types";

export interface PaymentStatusResult {
  id:     string;
  ref:    string;
  status: "PENDING" | "CONFIRMED" | "FAILED" | "EXPIRED" | "REFUNDED";
  paidAt: string | null;
  total:  number;
}

/**
 * GET /api/payments/status/[bookingId] — reconciles a PENDING booking against
 * the live Stripe/PayPack transaction instead of trusting a possibly-missed
 * webhook. Used by "My Tickets" so a stuck-Pending booking can be refreshed
 * without the user having to reopen the original payment page.
 */
export function useCheckPaymentStatus() {
  const queryClient = useQueryClient();
  return useMutation<PaymentStatusResult, Error, string>({
    mutationFn: async (bookingId: string) => {
      const res = await apiClient.get<ApiResponse<PaymentStatusResult>>(
        `/payments/status/${encodeURIComponent(bookingId)}`,
      );
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings", "mine"] });
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
  });
}
