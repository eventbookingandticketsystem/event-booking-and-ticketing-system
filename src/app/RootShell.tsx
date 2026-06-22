"use client";

import { QueryProvider } from "@/lib/api/QueryProvider";
import AuthProvider from "@/app/auth/AuthProvider";

/**
 * RootShell — client boundary for the root layout.
 *
 * Keeps SessionProvider and QueryClientProvider out of the server component
 * tree. This prevents Next.js from attempting to execute those providers
 * during prerender of /_global-error or /_not-found, which would crash with
 * "Cannot read properties of null (reading 'useContext')".
 */
export default function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <QueryProvider>{children}</QueryProvider>
    </AuthProvider>
  );
}
