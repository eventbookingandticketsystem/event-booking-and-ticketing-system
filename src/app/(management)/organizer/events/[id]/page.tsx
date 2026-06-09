'use client';

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import { notFound } from "next/navigation";
import { OrgTopbar } from "@/components/Organizer/OrgTopbar";
import { StatCard } from "@/components/Shared/StatCard";
import { LineChart } from "@/components/Shared/LineChart";
import { HBarChart } from "@/components/Shared/HBarChart";
import { StatusPill } from "@/components/Shared/StatusPill";
import { EmptyState } from "@/components/Shared/EmptyState";
import { Button } from "@/components/Shared/Button";
import { Icon } from "@/components/Shared/Icon";
import { formatSSP } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { ORG_EVENTS, GATE_AGENTS, EVENT_BY_ID, EVENTS, REPORT } from "@/lib/mock-data";

interface PageProps {
  params: Promise<{ id: string }>;
}

const TABS = [
  { id: "overview",   label: "Overview" },
  { id: "categories", label: "Ticket categories" },
  { id: "agents",     label: "Gate agents" },
  { id: "reports",    label: "Reports" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function progressColor(pct: number): string {
  if (pct >= 90) return "bg-status-danger";
  if (pct >= 60) return "bg-brand-orange";
  return "bg-status-success";
}

export default function OrgEventDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [tab, setTab] = useState<TabId>("overview");

  const meta = ORG_EVENTS.find((e) => e.id === id);
  if (!meta) notFound();

  const ev = EVENT_BY_ID[id] ?? EVENTS[0];
  const agents = GATE_AGENTS.filter((a) =>
    a.event.includes(meta.name) || a.event.includes("Juba Music"),
  ).slice(0, 4);

  const revenue = (ev.tiers ?? []).reduce(
    (s, t) => s + (t.capacity - t.remaining) * t.price,
    0,
  ) || 94550;

  // reportLineData/reportBarRows available if needed for reports tab
  void REPORT;

  return (
    <div className="flex flex-col min-h-full">
      <OrgTopbar crumb={meta.name} />

      <div className="px-6 pt-5 pb-10 flex flex-col gap-5">
        {/* Page header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-sm text-text-secondary mb-1.5">
              <button
                type="button"
                onClick={() => router.push("/organizer/events")}
                className="hover:text-text transition-colors focus-visible:outline-none"
              >
                My events
              </button>
              <Icon name="ChevronRight" size={14} className="text-text-muted" />
              <span className="text-text font-medium">{meta.name}</span>
            </div>
            <h1 className="font-display font-bold text-[26px] text-text flex items-center gap-3 flex-wrap m-0">
              {meta.name}
              <StatusPill status={meta.status as Parameters<typeof StatusPill>[0]["status"]} />
            </h1>
          </div>
          <Button variant="ghost" className="gap-2 shrink-0">
            <Icon name="Pencil" size={15} />
            Edit event
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange",
                tab === t.id
                  ? "border-brand-orange text-brand-orange"
                  : "border-transparent text-text-secondary hover:text-text",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ── */}
        {tab === "overview" && (
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Tickets Sold"
                value={meta.sold.toLocaleString()}
                chipIcon={<Icon name="Ticket" size={17} />}
                chipBg="bg-status-info-bg"
                chipFg="text-brand-navy"
                footText={`of ${meta.capacity.toLocaleString()} capacity`}
              />
              <StatCard
                label="Revenue"
                value={formatSSP(revenue)}
                chipIcon={<Icon name="TrendingUp" size={17} />}
                chipBg="bg-status-success-bg"
                chipFg="text-status-success"
                footDot="bg-status-success"
                footText="Gross sales"
              />
              <StatCard
                label="Categories"
                value={String((ev.tiers ?? []).length)}
                chipIcon={<Icon name="Layers" size={17} />}
                footText="Ticket tiers"
              />
              <StatCard
                label="Gate Agents"
                value={String(agents.length)}
                chipIcon={<Icon name="Users" size={17} />}
                chipBg="bg-status-warning-bg"
                chipFg="text-status-warning"
                footText="Assigned"
              />
            </div>

            <div className="bg-surface border border-border rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-border">
                <h2 className="font-display font-semibold text-[17px] text-text m-0">Event information</h2>
              </div>
              <div className="p-6">
                {/* Poster preview */}
                <div
                  className="w-full h-[180px] rounded-md mb-5"
                  style={{ backgroundImage: ev.poster, backgroundSize: "cover", backgroundPosition: "center" }}
                  aria-label="Event poster"
                />
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  <div>
                    <div className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1">Venue</div>
                    <div className="font-semibold text-text">{meta.venue}</div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1">Date</div>
                    <div className="font-semibold text-text">{meta.date}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1">About</div>
                    <div className="text-sm leading-relaxed text-text-secondary">{ev.about}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TICKET CATEGORIES ── */}
        {tab === "categories" && (
          <div className="bg-surface border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm" aria-label="Ticket categories">
                <thead>
                  <tr className="border-b border-border bg-surface-bg">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Category</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Price</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Sold</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide min-w-[160px]">Capacity</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(ev.tiers ?? []).map((t) => {
                    const sold = t.capacity - t.remaining;
                    const pct = Math.round((sold / t.capacity) * 100);
                    return (
                      <tr key={t.id} className="border-b border-border/50 last:border-b-0 hover:bg-surface-bg/50">
                        <td className="px-5 py-4 font-semibold">{t.name}</td>
                        <td className="px-4 py-4 font-mono text-[13px]">{formatSSP(t.price)}</td>
                        <td className="px-4 py-4 font-mono text-[13px]">{sold.toLocaleString()}</td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 rounded-pill bg-border overflow-hidden min-w-[80px]">
                              <div
                                className={cn("h-full rounded-pill", progressColor(pct))}
                                style={{ width: `${pct}%` }}
                                role="progressbar"
                                aria-valuenow={pct}
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-label={`${pct}% of capacity sold`}
                              />
                            </div>
                            <span className="font-mono text-[13px] text-text-secondary whitespace-nowrap">
                              {pct}% of {t.capacity.toLocaleString()}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            aria-label={`Edit ${t.name}`}
                            className="w-8 h-8 rounded border border-border text-text-secondary inline-flex items-center justify-center hover:border-brand-orange/40 hover:text-brand-orange transition-colors"
                          >
                            <Icon name="Pencil" size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── GATE AGENTS ── */}
        {tab === "agents" && (
          <div className="bg-surface border border-border rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="font-display font-semibold text-[17px] text-text m-0">Assigned gate agents</h2>
              <Button size="sm" className="gap-2">
                <Icon name="UserPlus" size={15} />
                Add gate agent
              </Button>
            </div>
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
                    <tr key={a.id} className="border-b border-border/50 last:border-b-0 hover:bg-surface-bg/50">
                      <td className="px-5 py-3.5 font-semibold">{a.name}</td>
                      <td className="px-4 py-3.5 font-mono text-[13px]">{a.phone}</td>
                      <td className="px-4 py-3.5 text-text-secondary">{a.gate}</td>
                      <td className="px-4 py-3.5"><StatusPill status={a.status as Parameters<typeof StatusPill>[0]["status"]} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── REPORTS ── */}
        {tab === "reports" && (
          <div className="bg-surface border border-border rounded-lg p-6">
            <EmptyState
              icon="ChartBar"
              heading="Full report available after the event"
              subtext="Live attendance is on the dashboard. A complete post-event report unlocks once this event is marked completed."
            />
          </div>
        )}
      </div>
    </div>
  );
}
