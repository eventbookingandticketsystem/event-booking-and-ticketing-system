import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tiketi — Event Ticketing for South Sudan",
  description:
    "QR-validated tickets. Mobile money payments. Works offline. Built for Juba.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
