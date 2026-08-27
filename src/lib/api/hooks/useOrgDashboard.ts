import { useQuery } from "@tanstack/react-query";
import apiClient from "../client";
import type { ApiResponse, ApiOrgDashboard } from "../types";
import type { DashboardData, TierBreakdown, ScanRecord } from "@/types/booking";

/**
 * Adapt the raw API tier breakdown → DashboardData.tiers shape.
 *
 * The API returns { name, capacity, sold, remaining, soldOut }.
 * The UI needs { name, count, total, color }.
 *
 * "count" = admitted tickets for this tier. The API does not return
 * per-tier admitted count — only the total "admitted" is available.
 * We use "sold" as the bar-chart value (tickets sold per tier) since
 * that's what the design shows in the HBarChart.
 */
const TIER_COLORS = [
  "var(--color-brand-orange)",
  "var(--color-brand-navy)",
  "var(--color-status-info)",
  "#1A6B3C",
  "#7A4A00",
];

function adaptTiers(
  tiers: ApiOrgDashboard["tiers"],
  totalSold: number,
): TierBreakdown[] {
  return tiers.map((t, i) => ({
    name:  t.name,
    count: t.sold,
    total: totalSold,
    color: TIER_COLORS[i % TIER_COLORS.length],
  }));
}

/**
 * Adapt a raw scan record scannedAt ISO string → "HH:MM:SS" display time.
 * Gate may be null → "—".
 * ticketRef may be null → "—".
 */
function adaptScan(s: ApiOrgDashboard["scans"][number]): ScanRecord {
  const date = new Date(s.scannedAt);
  const time = [
    String(date.getHours()).padStart(2, "0"),
    String(date.getMinutes()).padStart(2, "0"),
    String(date.getSeconds()).padStart(2, "0"),
  ].join(":");

  // The ScanRecord type uses "ADMIT" | "REJECT" — map everything else to "REJECT"
  const result: "ADMIT" | "REJECT" = s.result === "ADMIT" ? "ADMIT" : "REJECT";

  return {
    time,
    gate: s.gate ?? "—",
    tier: s.ticketRef ?? "—",  // ticketRef used as "tier" label in recent scans
    result,
  };
}

export function adaptOrgDashboard(raw: ApiOrgDashboard): DashboardData {
  return {
    eventId:   raw.eventId,
    eventName: raw.eventName,
    admitted:  raw.admitted,
    capacity:  raw.capacity,
    sold:      raw.sold,
    fraud:     raw.fraud,
    revenue:   raw.revenue,
    entryRate: raw.entryRate,
    tiers:     adaptTiers(raw.tiers, raw.sold),
    scans:     raw.scans.map(adaptScan),
  };
}

/**
 * GET /api/organizer/dashboard[?eventId=…]
 *
 * Requires ORGANIZER role + valid session.
 * Pass eventId to view a single event's dashboard, or omit/null to fetch
 * the aggregate "all events" overview.
 */
export function useOrgDashboard(eventId: string | null | undefined) {
  return useQuery<DashboardData>({
    queryKey: ["org-dashboard", eventId ?? "all"] as const,
    queryFn:  async () => {
      const url = eventId
        ? `/organizer/dashboard?eventId=${encodeURIComponent(eventId)}`
        : `/organizer/dashboard`;
      const response = await apiClient.get<ApiResponse<ApiOrgDashboard>>(url);
      return adaptOrgDashboard(response.data.data);
    },
  });
}
