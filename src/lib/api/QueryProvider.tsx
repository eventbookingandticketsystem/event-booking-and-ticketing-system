'use client';

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

/**
 * QueryProvider — wraps children with React Query's QueryClientProvider.
 *
 * Uses useState to create the QueryClient once per component lifecycle
 * (the correct pattern for Next.js App Router — avoids sharing state
 * across requests during SSR).
 *
 * Defaults:
 *   staleTime 30s      — data is fresh for 30 seconds; avoids redundant refetches
 *                        on tab re-focus or component remount
 *   retry 1            — one retry on failure; prevents hammering a 500/network error
 *   refetchOnWindowFocus false  — prevents unexpected refetches when user
 *                                 alt-tabs back; explicit refetch on user action only
 */
export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000, // 30 seconds
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
