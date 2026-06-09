'use client';

import { useState, use } from "react";
import { notFound } from "next/navigation";
import { useRouter } from "next/navigation";
import { StatusPill } from "@/components/Shared/StatusPill";
import type { StatusValue } from "@/components/Shared/StatusPill";
import { AlertBanner } from "@/components/Shared/AlertBanner";
import { Button } from "@/components/Shared/Button";
import { Icon } from "@/components/Shared/Icon";
import { formatSSP } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  ORGANIZER_BY_ID,
  ORG_EVENTS,
  GATE_AGENTS,
  ORG_ACTIVITY,
} from "@/lib/mock-data";
import type { OrganizerStatus } from "@/types/user";

interface PageProps {
  params: Promise<{ id: string }>;
}

type TabId = "events" | "agents" | "activity";

export default function AdminOrganizerDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();

  const org = ORGANIZER_BY_ID[id];
  if (!org) notFound();

  const [tab, setTab] = useState<TabId>("events");
  const [orgStatus, setOrgStatus] = useState<OrganizerStatus>(org.status);
  const [confirmSuspend, setConfirmSuspend] = useState(false);

  const events = ORG_EVENTS.slice(0, 5);
  const agents = GATE_AGENTS.slice(0, 3);

  const handleToggle = () => {
    if (orgStatus === "Active") setConfirmSuspend(true);
    else setOrgStatus("Active");
  };

  return (
    <div className="px-6 pt-5 pb-10 flex flex-col gap-5">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-sm text-text-secondary mb-1.5">
            <button
              type="button"
              onClick={() => router.push("/admin/organizers")}
              className="hover:text-text transition-colors focus-visible:outline-none"
            >
              Organizers
            </button>
            <Icon name="ChevronRight" size={14} className="text-text-muted" />
            <span className="text-text font-medium">{org.name}</span>
          </div>
          <h1 className="font-display font-bold text-[26px] text-text flex items-center gap-3 flex-wrap m-0">
            {org.name}
            <StatusPill status={orgStatus as StatusValue} />
          </h1>
        </div>
        <Button
          variant={orgStatus === "Active" ? "ghost" : "primary"}
          className="gap-2 shrink-0"
          onClick={handleToggle}
        >
          <Icon name={orgStatus === "Active" ? "Ban" : "Check"} size={15} />
          {orgStatus === "Active" ? "Suspend" : "Activate"}
        </Button>
      </div>

      {/* Suspended banner */}
      {orgStatus === "Suspended" && (
        <AlertBanner
          tone="warning"
          title="This organizer is suspended"
          message="They cannot create or manage events until reactivated."
        />
      )}

      {/* Info card */}
      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-display font-semibold text-[17px] text-text m-0">
            Organizer information
          </h2>
        </div>
        <div className="p-6 grid grid-cols-2 gap-x-8 gap-y-4">
          {[
            { label: "Contact",            value: org.contact              },
            { label: "Phone",              value: org.phone,  mono: true   },
            { label: "Organization",       value: org.org                  },
            { label: "Joined",             value: org.joined               },
            { label: "Total events",       value: String(org.events)       },
            { label: "Revenue generated",  value: formatSSP(org.revenue)   },
          ].map(({ label, value, mono }) => (
            <div key={label}>
              <div className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1">
                {label}
              </div>
              <div className={cn("font-semibold text-text", mono && "font-mono")}>
                {value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border" role="tablist">
        {(
          [
            ["events",   "Events"],
            ["agents",   "Gate agents"],
            ["activity", "Activity log"],
          ] as [TabId, string][]
        ).map(([tid, label]) => (
          <button
            key={tid}
            type="button"
            role="tab"
            aria-selected={tab === tid}
            onClick={() => setTab(tid)}
            className={cn(
              "px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange",
              tab === tid
                ? "border-brand-orange text-brand-orange"
                : "border-transparent text-text-secondary hover:text-text",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── EVENTS TAB ── */}
      {tab === "events" && (
        <div className="bg-surface border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" aria-label="Organizer events">
              <thead>
                <tr className="border-b border-border bg-surface-bg">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Event</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Venue</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Tickets sold</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => (
                  <tr
                    key={e.id}
                    className="border-b border-border/50 last:border-b-0 hover:bg-surface-bg/50"
                  >
                    <td className="px-5 py-3.5 font-semibold">{e.name}</td>
                    <td className="px-4 py-3.5">{e.date}</td>
                    <td className="px-4 py-3.5 text-text-muted max-w-[180px] truncate">{e.venue}</td>
                    <td className="px-4 py-3.5 font-mono text-[13px]">
                      {e.status === "Draft"
                        ? "—"
                        : `${e.sold.toLocaleString()} / ${e.capacity.toLocaleString()}`}
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusPill status={e.status as StatusValue} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── GATE AGENTS TAB ── */}
      {tab === "agents" && (
        <div className="bg-surface border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" aria-label="Gate agents">
              <thead>
                <tr className="border-b border-border bg-surface-bg">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Phone</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Gate</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody>
                {agents.map((a) => (
                  <tr
                    key={a.id}
                    className="border-b border-border/50 last:border-b-0 hover:bg-surface-bg/50"
                  >
                    <td className="px-5 py-3.5 font-semibold">{a.name}</td>
                    <td className="px-4 py-3.5 font-mono text-[13px]">{a.phone}</td>
                    <td className="px-4 py-3.5 text-text-secondary">{a.gate}</td>
                    <td className="px-4 py-3.5">
                      <StatusPill status={a.status as StatusValue} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── ACTIVITY LOG TAB ── */}
      {tab === "activity" && (
        <div className="bg-surface border border-border rounded-lg overflow-hidden">
          <div className="divide-y divide-border">
            {ORG_ACTIVITY.map((a, i) => (
              <div key={i} className="flex items-start gap-4 px-6 py-4">
                <div className="w-2 h-2 rounded-full bg-brand-orange mt-1.5 shrink-0" aria-hidden="true" />
                <div>
                  <div className="font-medium text-[14px] text-text">{a.action}</div>
                  <div className="font-mono text-xs text-text-secondary mt-0.5">{a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suspend confirm */}
      {confirmSuspend && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-brand-dark/60 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="suspend-title"
        >
          <div className="bg-surface rounded-lg shadow-pop w-full max-w-md p-6 flex flex-col gap-4">
            <h2 id="suspend-title" className="font-display font-bold text-[18px] text-text">
              Suspend {org.name}?
            </h2>
            <p className="text-sm text-text-secondary">
              They will be unable to create or manage events until reactivated. Active events stay
              live, but no new changes can be made.
            </p>
            <div className="flex justify-end gap-3 mt-2">
              <Button variant="ghost" onClick={() => setConfirmSuspend(false)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                className="gap-2"
                onClick={() => {
                  setOrgStatus("Suspended");
                  setConfirmSuspend(false);
                }}
              >
                <Icon name="Ban" size={15} />
                Suspend
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
