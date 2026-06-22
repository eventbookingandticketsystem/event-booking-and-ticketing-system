import type { Metadata } from "next";
import "./globals.css";
import RootShell from "./RootShell";

// Force all routes under the root layout to be dynamic so Next.js never
// attempts to statically prerender /_not-found or /_global-error through
// the client provider tree (SessionProvider, QueryClientProvider).
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tiketi — Event Booking & Ticketing",
  description:
    "QR-validated tickets. Mobile money payments. Works offline. Book and manage events with ease.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <RootShell>{children}</RootShell>
      </body>
    </html>
  );
}
