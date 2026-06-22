import { useQuery } from "@tanstack/react-query";
import apiClient from "../client";
import type { ApiResponse, ApiOrgReport } from "../types";

/**
 * GET /api/organizer/reports?eventId=…
 * Returns real post-event analytics: attendance, revenue, fraud, entry timeline,
 * tier breakdown, and fraud scan rows.
 *
 * Only runs when `eventId` is a non-empty string.
 */
export function useOrgReport(eventId: string | undefined) {
  return useQuery<ApiOrgReport>({
    queryKey: ["org-report", eventId] as const,
    enabled:  !!eventId,
    queryFn:  async () => {
      const res = await apiClient.get<ApiResponse<ApiOrgReport>>(
        `/organizer/reports?eventId=${encodeURIComponent(eventId!)}`,
      );
      return res.data.data;
    },
  });
}
