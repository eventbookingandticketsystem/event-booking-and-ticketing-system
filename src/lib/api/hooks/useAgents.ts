import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../client";
import type { ApiResponse, ApiGateAgent } from "../types";
import type { GateAgentType } from "@/types/user";

// ── Adapter ───────────────────────────────────────────────────────────────────

/**
 * Map DB status ("ACTIVE" | "INACTIVE") → UI AgentStatus ("Active" | "Inactive").
 */
function adaptStatus(s: string): GateAgentType["status"] {
  return s === "ACTIVE" ? "Active" : "Inactive";
}

export function adaptAgent(a: ApiGateAgent): GateAgentType {
  return {
    id:     a.id,        // MongoDB ObjectId string; GateAgentType.id accepts string | number
    name:   a.name,
    phone:  a.phone,
    event:  a.event.title,
    gate:   a.gate,
    status: adaptStatus(a.status),
    image:  null,        // ApiGateAgent does not expose image yet; placeholder for future
  };
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface UseAgentsParams {
  eventId?: string;
  status?:  string;
  page?:    number;
  limit?:   number;
}

export interface CreateAgentInput {
  name:    string;
  phone:   string;
  gate:    string;
  eventId: string;
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

/**
 * GET /api/agents — fetch gate agents for this organizer.
 */
export function useAgents(params: UseAgentsParams = {}) {
  return useQuery<GateAgentType[]>({
    queryKey: ["agents", params] as const,
    queryFn:  async () => {
      const sp = new URLSearchParams();
      if (params.eventId) sp.set("eventId", params.eventId);
      if (params.status)  sp.set("status",  params.status);
      if (params.page)    sp.set("page",    String(params.page));
      if (params.limit)   sp.set("limit",   String(params.limit));

      const qs  = sp.toString();
      const url = qs ? `/agents?${qs}` : "/agents";
      const res = await apiClient.get<ApiResponse<ApiGateAgent[]>>(url);
      return res.data.data.map(adaptAgent);
    },
  });
}

/**
 * POST /api/agents — create a gate agent (ORGANIZER only).
 * On success: invalidates ["agents"] so the table refreshes.
 */
export function useCreateAgent() {
  const queryClient = useQueryClient();

  return useMutation<ApiGateAgent, Error, CreateAgentInput>({
    mutationFn: async (input) => {
      const res = await apiClient.post<ApiResponse<ApiGateAgent>>("/agents", input);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
    },
  });
}
