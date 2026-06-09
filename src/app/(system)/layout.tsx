'use client';

import { useState } from "react";
import { AdminSidebar } from "@/components/Admin/AdminSidebar";
import { AdminTopbar } from "@/components/Admin/AdminTopbar";

// Map nav IDs to display labels
const NAV_LABELS: Record<string, string> = {
  overview:   "Overview",
  organizers: "Organizers",
  events:     "Events",
  gateagents: "Gate Agents",
  health:     "System Health",
  settings:   "Settings",
};

export default function SystemLayout({ children }: { children: React.ReactNode }) {
  const [nav, setNav] = useState("overview");
  const crumb = NAV_LABELS[nav] ?? "Overview";

  return (
    <>
      {/* Desktop layout */}
      <div className="hidden lg:flex min-h-screen bg-surface-bg">
        <AdminSidebar active={nav} onNav={setNav} />
        <div className="flex flex-col flex-1 min-w-0">
          <AdminTopbar crumb={crumb} onCrumbRoot={() => setNav("overview")} />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>

      {/* Mobile fallback */}
      <div className="flex lg:hidden items-center justify-center min-h-screen bg-surface-bg px-6">
        <div className="text-center max-w-xs">
          <div className="w-12 h-12 rounded-full bg-status-danger-bg inline-flex items-center justify-center mb-4">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-status-danger" aria-hidden="true">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          </div>
          <h1 className="font-display font-bold text-xl text-text mb-2">Desktop required</h1>
          <p className="text-sm text-text-secondary">
            The admin console is designed for desktop use. Please open Tiketi on a larger screen.
          </p>
        </div>
      </div>
    </>
  );
}
