import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../client";
import type { ApiResponse, ApiGateAgent } from "../types";

export interface UpdateAgentInput {
  status: "ACTIVE" | "INACTIVE";
}

/** PATCH /api/agents/[id] — update agent status */
export function useUpdateAgent(agentId: string) {
  const queryClient = useQueryClient();
  return useMutation<ApiGateAgent, Error, UpdateAgentInput>({
    mutationFn: async (input) => {
      const res = await apiClient.patch<ApiResponse<ApiGateAgent>>(
        `/agents/${encodeURIComponent(agentId)}`,
        input,
      );
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
    },
  });
}

/** DELETE /api/agents/[id] — permanently removes the agent */
export function useDeleteAgent(agentId: string) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, void>({
    mutationFn: async () => {
      await apiClient.delete(`/agents/${encodeURIComponent(agentId)}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
    },
  });
}
