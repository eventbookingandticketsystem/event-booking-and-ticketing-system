import { useQuery } from "@tanstack/react-query";
import apiClient from "../client";
import { adaptTickets } from "../adapters";
import type { ApiResponse, ApiTicket } from "../types";
import type { TicketType } from "@/types/ticket";

export interface UseTicketsParams {
  status?: "VALID" | "USED" | "EXPIRED";
  page?: number;
  limit?: number;
}

/**
 * Fetch the authenticated user's tickets from GET /api/tickets.
 *
 * Requires a valid session cookie — returns an empty array if the user
 * is not signed in (the API will return 403; React Query surfaces the
 * error so the caller can decide how to handle it).
 *
 * Returns adapted TicketType[] so components need no changes.
 */
export function useTickets(params: UseTicketsParams = {}) {
  return useQuery<TicketType[]>({
    queryKey: ["tickets", params] as const,
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params.status) searchParams.set("status", params.status);
      if (params.page)   searchParams.set("page",   String(params.page));
      if (params.limit)  searchParams.set("limit",  String(params.limit));

      const qs = searchParams.toString();
      const url = qs ? `/tickets?${qs}` : "/tickets";

      const response = await apiClient.get<ApiResponse<ApiTicket[]>>(url);
      return adaptTickets(response.data.data);
    },
  });
}
