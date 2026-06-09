'use client';

import { useState } from "react";
import { OrgTopbar } from "@/components/Organizer/OrgTopbar";
import { StatCard } from "@/components/Shared/StatCard";
import { LineChart } from "@/components/Shared/LineChart";
import { HBarChart } from "@/components/Shared/HBarChart";
import { StatusPill } from "@/components/Shared/StatusPill";
import { Button } from "@/components/Shared/Button";
import { Icon } from "@/components/Shared/Icon";
import { formatSSP } from "@/lib/utils";
import { REPORT } from "@/lib/mock-data";

export default function OrgReportsPage() {
  const [toast, setToast] = useState(false);
  const r = REPORT;

  const lineData = r.entryRate.map((pt) => ({
    label: pt.t,
    value: pt.v,
  }));
  const barData = r.tiers.map((t) => ({
    label: t.name,
    value: t.count,
    color: t.color,
  }));

  const handleExport = () => {
    setToast(true);
    setTimeout(() => setToast(false), 2000);
  };

  return (
    <div className="flex flex-col min-h-full">
      <OrgTopbar crumb="Reports" />

      <div className="px-6 pt-5 pb-10 flex flex-col gap-6">
        {/* Page header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display font-bold text-[26px] text-text mb-0.5">Reports</h1>
            <p className="text-sm text-text-secondary">Post-event analytics and exports.</p>
          </div>
          {/* Event selector */}
          <div className="flex items-center gap-2 px-3.5 py-2 border border-border rounded-md bg-surface-bg text-sm font-medium text-text cursor-pointer hover:border-brand-orange/40 transition-colors">
            <Icon name="Calendar" size={15} className="text-text-secondary" />
            <span>{r.event}</span>
            <Icon name="ChevronDown" size={14} className="text-text-secondary" />
          </div>
        </div>

        {/* 4 stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Attended"
            value={r.attended.toLocaleString()}
            chipIcon={<Icon name="Users" size={17} />}
            footText="Validated entries"
          />
          <StatCard
            label="Total Revenue"
            value={formatSSP(r.revenue)}
            chipIcon={<Icon name="TrendingUp" size={17} />}
            chipBg="bg-status-success-bg"
            chipFg="text-status-success"
            footDot="bg-status-success"
            footText="Gross sales"
          />
          <StatCard
            label="Fraud Attempts"
            value={String(r.fraud)}
            chipIcon={<Icon name="ShieldAlert" size={17} />}
            chipBg="bg-status-danger-bg"
            chipFg="text-status-danger"
            footDot="bg-status-danger"
            footText="Rejected at gate"
          />
          <StatCard
            label="Scan Duration"
            value={r.duration}
            chipIcon={<Icon name="Clock" size={17} />}
            chipBg="bg-status-warning-bg"
            chipFg="text-status-warning"
            footText="First to last scan"
          />
        </div>

        {/* Entry timeline chart */}
        <div className="bg-surface border border-border rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-[17px] text-text m-0">Entry timeline</h3>
            <span className="text-sm text-text-muted">Admissions per 30 min</span>
          </div>
          <LineChart data={lineData} />
        </div>

        {/* 2-col grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Tier breakdown */}
          <div className="bg-surface border border-border rounded-lg p-5">
            <h3 className="font-display font-semibold text-[17px] text-text mb-3 m-0">Tier breakdown</h3>
            <HBarChart data={barData} />
          </div>

          {/* Fraud table */}
          <div className="bg-surface border border-border rounded-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="font-display font-semibold text-[17px] text-text m-0">Fraud attempts</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" aria-label="Fraud attempts">
                <thead>
                  <tr className="border-b border-border bg-surface-bg">
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wide">Time</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wide">Gate</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wide">Reason</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wide">Ticket ID</th>
                  </tr>
                </thead>
                <tbody>
                  {r.fraudRows.map((x: { time: string; gate: string; reason: string; frag: string }, i: number) => (
                    <tr key={i} className="border-b border-border/50 last:border-b-0 hover:bg-surface-bg/50">
                      <td className="px-4 py-3 font-mono text-[13px]">{x.time}</td>
                      <td className="px-4 py-3 text-text-secondary">{x.gate}</td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1.5">
                          <StatusPill status="Rejected" />
                          <span className="text-[13px] text-text-secondary">{x.reason}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-[13px] text-text-muted">{x.frag}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Export buttons */}
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={handleExport} className="gap-2">
            <Icon name="Download" size={16} />
            Download CSV
          </Button>
          <Button variant="ghost" onClick={handleExport} className="gap-2">
            <Icon name="FileText" size={16} />
            Download PDF
          </Button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-md bg-brand-navy text-white text-sm font-semibold shadow-pop"
          role="status"
          aria-live="polite"
        >
          <Icon name="TriangleAlert" size={15} />
          Export not available in demo
        </div>
      )}
    </div>
  );
}
