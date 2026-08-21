import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../client";
import type { ApiResponse, ApiAdminStats, ApiAdminUser, ApiAdminEvent } from "../types";
import { formatDate } from "@/lib/utils";
import type { OrganizerType } from "@/types/user";
import type { AdminEventRow } from "@/types/event";
import type { AdminOverviewData } from "@/types/scan";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface UseAdminUsersParams {
  role?:   string;
  search?: string;
  page?:   number;
  limit?:  number;
}

export interface UseAdminEventsParams {
  status?: string;
  search?: string;
  page?:   number;
  limit?:  number;
}

export interface UpdateUserInput {
  role?:   string;
  name?:   string;
  phone?:  string;
  status?: "Active" | "Suspended";
}

export interface UpdateEventFlagsInput {
  flagged?: boolean;
  status?:  string;
}

// ── Adapters ──────────────────────────────────────────────────────────────────

/**
 * Adapt API stats to the AdminOverviewData shape used by the AD1 page.
 * OBSERVED: totalOrganizers, activeToday, ticketsAllTime, fraud30d, salesTrend[{t,v}]
 */
export function adaptAdminStats(s: ApiAdminStats): AdminOverviewData {
  return {
    organizers:    s.totalOrganizers,
    activeToday:   s.activeToday,
    ticketsAllTime: s.ticketsAllTime,
    fraud30d:      s.fraud30d,
    salesTrend:    s.salesTrend,
    // activity table is not in the API — kept as empty array; AD1 hides the table when empty
    activity:      [],
  };
}

/**
 * Adapt API user → OrganizerType row for the AD2 organizers table.
 * OBSERVED: id(string), name(null|str), email(null|str), phone(null|str), role, createdAt(ISO)
 */
export function adaptAdminUserToOrganizer(u: ApiAdminUser): OrganizerType {
  const joined = u.createdAt
    ? new Date(u.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    : "—";
  return {
    id:      u.id,
    name:    u.orgProfile?.orgName ?? u.name ?? "—",
    contact: u.orgProfile?.contactName ?? u.name ?? "—",
    phone:   u.phone ?? "—",
    org:     u.orgProfile?.orgName ?? "—",
    events:  0,    // not returned by the list endpoint — shown as "—" in UI
    revenue: 0,    // not returned — shown as "—" in UI
    status:  (u.orgProfile?.status === "Suspended" ? "Suspended" : "Active") as "Active" | "Suspended",
    joined,
  };
}

/**
 * Adapt API event → AdminEventRow for the AD3 events table.
 * OBSERVED: id, title, status, date(ISO), category, orgProfile.orgName, _count.tickets
 */
export function adaptAdminEvent(e: ApiAdminEvent): AdminEventRow {
  return {
    id:         e.id,
    name:       e.title,
    organizer:  e.orgProfile?.orgName ?? e.organizer ?? "—",
    date:       formatDate(e.date),
    status:     adaptEventStatus(e.status),
    sold:       e._count.tickets,  // tickets issued ≈ sold
    fraud:      0,                 // not in list endpoint — scan query required
    flagged:    e.flagged ?? false,
  };
}

function adaptEventStatus(s: string): AdminEventRow["status"] {
  switch (s) {
    case "ONGOING":   return "Ongoing";
    case "COMPLETED": return "Completed";
    case "CANCELLED": return "Completed";
    case "DRAFT":     return "Draft";
    default:          return "Upcoming";   // PUBLISHED → Upcoming
  }
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

/**
 * GET /api/admin/stats — platform-wide overview numbers + sales trend.
 */
export function useAdminStats() {
  return useQuery<AdminOverviewData>({
    queryKey: ["admin-stats"] as const,
    queryFn:  async () => {
      const res = await apiClient.get<ApiResponse<ApiAdminStats>>("/admin/stats");
      return adaptAdminStats(res.data.data);
    },
  });
}

/**
 * GET /api/admin/users — paginated user list (ADMIN only).
 * Returns raw ApiAdminUser[] so callers can adapt as needed.
 */
export function useAdminUsers(params: UseAdminUsersParams = {}) {
  return useQuery<{ data: ApiAdminUser[]; total: number; page: number; totalPages: number }>({
    queryKey: ["admin-users", params] as const,
    queryFn:  async () => {
      const sp = new URLSearchParams();
      if (params.role)   sp.set("role",   params.role);
      if (params.search) sp.set("search", params.search);
      if (params.page)   sp.set("page",   String(params.page));
      if (params.limit)  sp.set("limit",  String(params.limit));

      const qs  = sp.toString();
      const url = qs ? `/admin/users?${qs}` : "/admin/users";
      const res = await apiClient.get<{ success: boolean; data: ApiAdminUser[]; pagination: { total: number; page: number; totalPages: number } }>(url);
      return {
        data:       res.data.data,
        total:      res.data.pagination?.total ?? 0,
        page:       res.data.pagination?.page  ?? 1,
        totalPages: res.data.pagination?.totalPages ?? 1,
      };
    },
  });
}

/**
 * GET /api/admin/users/[id] — single user with orgProfile / agentProfile.
 */
export function useAdminUser(userId: string) {
  return useQuery<ApiAdminUser>({
    queryKey: ["admin-user", userId] as const,
    enabled:  !!userId,
    queryFn:  async () => {
      const res = await apiClient.get<ApiResponse<ApiAdminUser>>(`/admin/users/${userId}`);
      return res.data.data;
    },
  });
}

/**
 * PATCH /api/admin/users/[id] — update role, name, or phone.
 */
export function useUpdateAdminUser(userId: string) {
  const queryClient = useQueryClient();
  return useMutation<ApiAdminUser, Error, UpdateUserInput>({
    mutationFn: async (input) => {
      const res = await apiClient.patch<ApiResponse<ApiAdminUser>>(`/admin/users/${userId}`, input);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-user", userId] });
    },
  });
}

/**
 * PATCH /api/admin/events/[id] — toggle `flagged` or `status` (ADMIN only).
 */
export function useUpdateAdminEvent(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation<ApiAdminEvent, Error, UpdateEventFlagsInput>({
    mutationFn: async (input) => {
      const res = await apiClient.patch<ApiResponse<ApiAdminEvent>>(`/admin/events/${eventId}`, input);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-events"] });
    },
  });
}

/**
 * DELETE /api/admin/events/[id] — permanently remove an event (ADMIN only).
 */
export function useDeleteAdminEvent(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, void>({
    mutationFn: async () => {
      await apiClient.delete(`/admin/events/${eventId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-events"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["explore-events"] });
    },
  });
}

/**
 * DELETE /api/admin/users/[id] — permanently remove a user (and, for
 * organizers, their events/tiers/tickets/bookings/gate agents). ADMIN only.
 */
export function useDeleteAdminUser() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (userId) => {
      await apiClient.delete(`/admin/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-events"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
  });
}

/**
 * GET /api/admin/events — paginated event list (ADMIN only).
 */
export function useAdminEvents(params: UseAdminEventsParams = {}) {
  return useQuery<{ data: AdminEventRow[]; total: number; page: number; totalPages: number }>({
    queryKey: ["admin-events", params] as const,
    queryFn:  async () => {
      const sp = new URLSearchParams();
      if (params.status) sp.set("status", params.status);
      if (params.search) sp.set("search", params.search);
      if (params.page)   sp.set("page",   String(params.page));
      if (params.limit)  sp.set("limit",  String(params.limit));

      const qs  = sp.toString();
      const url = qs ? `/admin/events?${qs}` : "/admin/events";
      const res = await apiClient.get<{ success: boolean; data: ApiAdminEvent[]; pagination: { total: number; page: number; totalPages: number } }>(url);
      return {
        data:       res.data.data.map(adaptAdminEvent),
        total:      res.data.pagination?.total ?? 0,
        page:       res.data.pagination?.page  ?? 1,
        totalPages: res.data.pagination?.totalPages ?? 1,
      };
    },
  });
}
