import axios from "axios";
import type { ApiResponse } from "./types";

/**
 * Axios instance pre-configured for same-origin /api calls.
 *
 * baseURL: "/api" — relative, resolved by the browser against the page's origin.
 * This is client-only code: the queryFns that use this client are only called
 * after browser hydration (React Query defers fetching until mount; it does not
 * execute queryFns during server-side render).
 *
 * Response interceptor unwraps the { success, data, pagination } envelope:
 *   • success: true  → resolves with { data, pagination? }
 *   • success: false → rejects with Error(message) from the server
 *   • HTTP error     → rejects with Error(body.message ?? status text)
 */
const apiClient = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
  // Same-origin: the browser includes the session cookie automatically.
  // No Authorization header needed — NextAuth uses HttpOnly cookies.
});

// ── Response interceptor ─────────────────────────────────────────────────────

apiClient.interceptors.response.use(
  (response) => {
    const body = response.data as {
      success: boolean;
      data?: unknown;
      pagination?: unknown;
      message?: string;
    };

    if (body.success === false) {
      // Server returned 2xx but success: false — treat as an error
      throw new Error(body.message ?? "Request failed");
    }

    // Unwrap into ApiResponse<T>
    const unwrapped: ApiResponse<unknown> = {
      data: body.data,
      ...(body.pagination !== undefined && { pagination: body.pagination as ApiResponse<unknown>["pagination"] }),
    };

    // Replace the axios response data with the unwrapped shape
    response.data = unwrapped;
    return response;
  },
  (error) => {
    // HTTP error (4xx / 5xx)
    const serverMessage: string | undefined =
      error.response?.data?.message;
    const statusText: string = error.response?.statusText ?? "Network error";
    throw new Error(serverMessage ?? statusText);
  },
);

export default apiClient;
