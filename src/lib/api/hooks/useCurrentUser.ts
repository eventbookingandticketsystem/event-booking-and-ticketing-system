import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../client";
import type { ApiResponse, ApiCurrentUser, ApiUpdatedUser } from "../types";

export interface UpdateProfileInput {
  name?:  string;
  phone?: string;
  image?: string;
}

/**
 * GET /api/auth/me — fetch the signed-in user's profile.
 * Returns the full user object including orgProfile / agentProfile.
 */
export function useCurrentUser() {
  return useQuery<ApiCurrentUser>({
    queryKey: ["current-user"] as const,
    queryFn:  async () => {
      const res = await apiClient.get<ApiResponse<ApiCurrentUser>>("/auth/me");
      return res.data.data;
    },
  });
}

/**
 * PATCH /api/auth/me — update name / phone / image.
 * On success: invalidates ["current-user"] so the settings page re-renders.
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation<ApiUpdatedUser, Error, UpdateProfileInput>({
    mutationFn: async (input) => {
      const res = await apiClient.patch<ApiResponse<ApiUpdatedUser>>("/auth/me", input);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["current-user"] });
    },
  });
}
