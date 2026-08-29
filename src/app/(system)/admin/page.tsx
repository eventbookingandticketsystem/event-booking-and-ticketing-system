'use client';

import { StatCard } from "@/components/Shared/StatCard";
import { LineChart } from "@/components/Shared/LineChart";
import { StatusPill } from "@/components/Shared/StatusPill";
import { AlertBanner } from "@/components/Shared/AlertBanner";
import { Button } from "@/components/Shared/Button";
import { Icon } from "@/components/Shared/Icon";
import { useAdminStats } from "@/lib/api/hooks/useAdminData";
import type { ActivityRecord } from "@/types/scan";

export default function AdminOverviewPage() {
  const { data, isLoading, isError, error, refetch } = useAdminStats();

  // ── Error state ────────────────────────────────────────────────────────────
  if (isError) {
    return (
      <div className="px-6 pt-5 pb-10 flex flex-col gap-5">
        <div>
          <h1 className="font-display font-bold text-[26px] text-text mb-0.5">System overview</h1>
          <p className="text-sm text-text-secondary">System-wide activity across all organizers.</p>
        </div>
        <AlertBanner
          tone="danger"
          title="Failed to load system data"
          message={error?.message ?? "The monitoring service could not be reached."}
        />
        <div>
          <Button onClick={() => refetch()} className="gap-2">
            <Icon name="RefreshCw" size={15} />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (isLoading || !data) {
    return (
      <div className="px-6 pt-5 pb-10 flex flex-col gap-6">
        <div>
          <div className="h-7 w-60 skeleton rounded mb-2" />
          <div className="h-4 w-48 skeleton rounded" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-surface border border-border rounded-lg p-5">
              <div className="h-3 w-24 skeleton rounded mb-3" />
              <div className="h-8 w-32 skeleton rounded mb-4" />
              <div className="h-2 w-full skeleton rounded" />
            </div>
          ))}
        </div>
        <div className="bg-surface border border-border rounded-lg p-5">
          <div className="h-5 w-32 skeleton rounded mb-4" />
          <div className="h-50 skeleton rounded" />
        </div>
      </div>
    );
  }

  // ── Loaded ─────────────────────────────────────────────────────────────────
  const lineData = data.salesTrend.map((pt) => ({ label: pt.t, value: pt.v }));
  const now = new Date().toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  return (
    <div className="flex flex-col min-h-full">
      <div className="px-6 pt-5 pb-10 flex flex-col gap-6">
        {/* Page header */}
        <div>
          <h1 className="font-display font-bold text-[26px] text-text mb-0.5">System overview</h1>
          <p className="text-sm text-text-secondary flex items-center gap-1.5">
            <Icon name="RefreshCw" size={13} className="text-text-muted" />
            Updated just now · {now}
          </p>
        </div>

        {/* 6 stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard
            label="Total Organizers"
            value={String(data.organizers)}
            chipIcon={<Icon name="Building2" size={17} />}
            footText="Platform total"
          />
          <StatCard
            label="Total Events"
            value={String(data.totalEvents)}
            chipIcon={<Icon name="CalendarRange" size={17} />}
            footText="All statuses"
          />
          <StatCard
            label="Active Events"
            value={String(data.activeEvents)}
            chipIcon={<Icon name="CalendarClock" size={17} />}
            chipBg="bg-status-info-bg"
            chipFg="text-brand-navy"
            footDot="bg-status-info"
            footText="Today or upcoming"
          />
          <StatCard
            label="Active Events Today"
            value={String(data.activeToday)}
            chipIcon={<Icon name="CalendarCheck" size={17} />}
            chipBg="bg-status-info-bg"
            chipFg="text-brand-navy"
            footDot="bg-status-info"
            footText="Gates open now"
          />
          <StatCard
            label="Tickets Sold (all time)"
            value={data.ticketsAllTime.toLocaleString()}
            chipIcon={<Icon name="Ticket" size={17} />}
            chipBg="bg-status-success-bg"
            chipFg="text-status-success"
            footDot="bg-status-success"
            footText="Platform total"
          />
          <StatCard
            label="Fraud Attempts (30d)"
            value={String(data.fraud30d)}
            chipIcon={<Icon name="ShieldAlert" size={17} />}
            chipBg="bg-status-danger-bg"
            chipFg="text-status-danger"
            footDot="bg-status-danger"
            footText="Rejected at gates"
          />
        </div>

        {/* Sales trend chart */}
        <div className="bg-surface border border-border rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-[17px] text-text m-0">Tickets sold</h3>
            <span className="text-sm text-text-muted">Per day · last 14 days</span>
          </div>
          <LineChart data={lineData} />
        </div>

        {/* Recent activity — shows when API provides entries */}
        {data.activity.length > 0 && (
          <div className="bg-surface border border-border rounded-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="font-display font-semibold text-[17px] text-text m-0">Recent activity</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" aria-label="Recent activity">
                <thead>
                  <tr className="border-b border-border bg-surface-bg">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Time</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Actor</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Action</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.activity.map((a: ActivityRecord, i: number) => (
                    <tr key={i} className="border-b border-border/50 last:border-b-0 hover:bg-surface-bg/50">
                      <td className="px-5 py-3.5 font-mono text-[13px] whitespace-nowrap">{a.time}</td>
                      <td className="px-4 py-3.5 font-semibold">{a.actor}</td>
                      <td className="px-4 py-3.5 text-text-secondary">{a.action}</td>
                      <td className="px-4 py-3.5">
                        <StatusPill status={a.status as Parameters<typeof StatusPill>[0]["status"]} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
