import { useQuery } from "@tanstack/react-query";
import apiClient from "../client";
import { adaptTicket } from "../adapters";
import type { ApiResponse, ApiTicketDetail } from "../types";
import type { TicketType } from "@/types/ticket";

/**
 * Fetch a single ticket by its human-readable ref (e.g. "TIX-7K2M-9QX4")
 * from GET /api/tickets/[ref].
 *
 * The API supports lookup by ticketRef when the segment starts with "TIX-".
 */
export function useTicket(ticketRef: string) {
  return useQuery<TicketType>({
    queryKey: ["ticket", ticketRef] as const,
    enabled: !!ticketRef,
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<ApiTicketDetail>>(
        `/tickets/${encodeURIComponent(ticketRef)}`,
      );
      return adaptTicket(response.data.data);
    },
  });
}
