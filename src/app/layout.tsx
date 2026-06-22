import type { Metadata } from "next";
import "./globals.css";
import { QueryProvider } from "@/lib/api/QueryProvider";
import AuthProvider from "@/app/auth/AuthProvider";

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
        <AuthProvider>
          <QueryProvider>{children}</QueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
