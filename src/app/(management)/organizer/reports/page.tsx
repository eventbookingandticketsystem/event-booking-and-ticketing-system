'use client';

import { useState, useCallback } from "react";
import { OrgTopbar } from "@/components/Organizer/OrgTopbar";
import { StatCard } from "@/components/Shared/StatCard";
import { LineChart } from "@/components/Shared/LineChart";
import { HBarChart } from "@/components/Shared/HBarChart";
import { StatusPill } from "@/components/Shared/StatusPill";
import { Button } from "@/components/Shared/Button";
import { Icon } from "@/components/Shared/Icon";
import { formatSSP } from "@/lib/utils";
import { REPORT } from "@/lib/mock-data";
import { useOrgEvents } from "@/lib/api/hooks/useOrgEvents";

// ── CSV helpers ───────────────────────────────────────────────────────────────

function escapeCsv(v: string | number): string {
  const s = String(v);
  return s.includes(",") || s.includes('"') || s.includes("\n")
    ? `"${s.replace(/"/g, '""')}"`
    : s;
}

function buildCsvRows(headers: string[], rows: (string | number)[][]): string {
  const lines = [
    headers.map(escapeCsv).join(","),
    ...rows.map((r) => r.map(escapeCsv).join(",")),
  ];
  return lines.join("\n");
}

function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function OrgReportsPage() {
  const [selectedEventId, setSelectedEventId] = useState("");
  const { data: events = [] } = useOrgEvents({ limit: 50 });

  // Report data is still mock — no real reports API exists.
  const r = REPORT;
  const selectedEvent = events.find((e) => String(e.id) === selectedEventId);
  const displayName   = selectedEvent?.name ?? r.event;

  const lineData = r.entryRate.map((pt) => ({ label: pt.t, value: pt.v }));
  const barData  = r.tiers.map((t)     => ({ label: t.name, value: t.count, color: t.color }));

  // ── Export handlers ───────────────────────────────────────────────────────

  const handleExportCsv = useCallback(() => {
    // Build CSV from the visible report data
    const eventName = displayName;
    const date      = new Date().toLocaleDateString("en-GB");

    // Summary section
    const summaryHeaders = ["Metric", "Value"];
    const summaryRows: (string | number)[][] = [
      ["Event",           eventName],
      ["Export date",     date],
      ["Total attended",  r.attended],
      ["Total revenue",   `SSP ${r.revenue.toLocaleString("en-US")}`],
      ["Fraud attempts",  r.fraud],
      ["Scan duration",   r.duration],
    ];

    // Entry rate section
    const rateHeaders = ["Time", "Admissions"];
    const rateRows: (string | number)[][] = r.entryRate.map((pt) => [pt.t, pt.v]);

    // Tier breakdown section
    const tierHeaders = ["Ticket category", "Admitted count"];
    const tierRows: (string | number)[][] = r.tiers.map((t) => [t.name, t.count]);

    // Fraud section
    const fraudHeaders = ["Time", "Gate", "Reason", "Ticket fragment"];
    const fraudRows: (string | number)[][] = r.fraudRows.map(
      (x: { time: string; gate: string; reason: string; frag: string }) =>
        [x.time, x.gate, x.reason, x.frag],
    );

    const csv = [
      "=== SUMMARY ===",
      buildCsvRows(summaryHeaders, summaryRows),
      "",
      "=== ENTRY TIMELINE ===",
      buildCsvRows(rateHeaders, rateRows),
      "",
      "=== TIER BREAKDOWN ===",
      buildCsvRows(tierHeaders, tierRows),
      "",
      "=== FRAUD ATTEMPTS ===",
      buildCsvRows(fraudHeaders, fraudRows),
    ].join("\n");

    const slug = eventName.replace(/\s+/g, "-").toLowerCase().slice(0, 40);
    downloadFile(csv, `tiketi-report-${slug}.csv`, "text/csv;charset=utf-8;");
  }, [r, displayName]);

  const handleExportPdf = useCallback(() => {
    // Build an HTML-based print document and trigger browser print-to-PDF
    const eventName = displayName;
    const date      = new Date().toLocaleDateString("en-GB", {
      day: "numeric", month: "long", year: "numeric",
    });

    const tierRows = r.tiers
      .map((t: { name: string; count: number }) => `<tr><td>${t.name}</td><td>${t.count.toLocaleString()}</td></tr>`)
      .join("");

    const fraudRows = r.fraudRows
      .map((x: { time: string; gate: string; reason: string; frag: string }) =>
        `<tr><td>${x.time}</td><td>${x.gate}</td><td>${x.reason}</td><td>${x.frag}</td></tr>`,
      )
      .join("");

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Tiketi Event Report — ${eventName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Inter, system-ui, sans-serif; font-size: 13px; color: #0F1A20; padding: 32px; }
    h1 { font-size: 22px; font-weight: 700; margin-bottom: 4px; }
    h2 { font-size: 14px; font-weight: 600; margin: 24px 0 8px; border-bottom: 1px solid #E2E0D8; padding-bottom: 4px; }
    .meta { color: #5A6870; font-size: 12px; margin-bottom: 24px; }
    .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 8px; }
    .stat { border: 1px solid #E2E0D8; border-radius: 6px; padding: 12px; }
    .stat-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .05em; color: #5A6870; }
    .stat-value { font-size: 20px; font-weight: 700; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid #E2E0D8; }
    th { background: #F7F6F2; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: .04em; color: #5A6870; }
    @media print { body { padding: 16px; } }
  </style>
</head>
<body>
  <h1>Event Report</h1>
  <p class="meta">${eventName} &nbsp;·&nbsp; Generated ${date}</p>

  <div class="stats">
    <div class="stat">
      <div class="stat-label">Total attended</div>
      <div class="stat-value">${r.attended.toLocaleString()}</div>
    </div>
    <div class="stat">
      <div class="stat-label">Total revenue</div>
      <div class="stat-value">SSP ${r.revenue.toLocaleString("en-US")}</div>
    </div>
    <div class="stat">
      <div class="stat-label">Fraud attempts</div>
      <div class="stat-value">${r.fraud}</div>
    </div>
    <div class="stat">
      <div class="stat-label">Scan duration</div>
      <div class="stat-value">${r.duration}</div>
    </div>
  </div>

  <h2>Tier breakdown</h2>
  <table>
    <thead><tr><th>Ticket category</th><th>Admitted</th></tr></thead>
    <tbody>${tierRows}</tbody>
  </table>

  <h2>Fraud attempts</h2>
  <table>
    <thead><tr><th>Time</th><th>Gate</th><th>Reason</th><th>Ticket fragment</th></tr></thead>
    <tbody>${fraudRows}</tbody>
  </table>
</body>
</html>`;

    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
  }, [r, displayName]);

  return (
    <div className="flex flex-col min-h-full">
      <OrgTopbar crumb="Reports" />

      <div className="px-6 pt-5 pb-10 flex flex-col gap-6">
        {/* Page header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display font-bold text-[26px] text-text mb-0.5">Reports</h1>
            <p className="text-sm text-text-secondary">
              Post-event analytics for{" "}
              <span className="font-semibold text-text">{displayName}</span>
            </p>
          </div>
          {/* Event selector — real events from API */}
          <div className="relative">
            <Icon name="Calendar" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              aria-label="Select event for report"
              className="h-9 pl-8 pr-8 border border-border rounded-md bg-surface-bg text-sm font-medium text-text appearance-none focus:outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20"
            >
              <option value="">{r.event}</option>
              {events.map((e) => (
                <option key={String(e.id)} value={String(e.id)}>{e.name}</option>
              ))}
            </select>
            <Icon name="ChevronDown" size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
          </div>
        </div>

        {/* Sample data notice */}
        <div className="flex items-start gap-3 px-4 py-3 rounded-md bg-status-warning-bg border border-status-warning/30 text-sm text-status-warning">
          <Icon name="TriangleAlert" size={16} className="shrink-0 mt-0.5" />
          <span>
            <span className="font-semibold">Sample data shown.</span>{" "}
            Post-event reports with real scan, revenue, and attendance data are a planned feature.
            Live admission stats are available on the{" "}
            <a href="/organizer" className="underline underline-offset-2 hover:text-status-warning/80">Dashboard</a>.
          </span>
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
          <Button variant="ghost" onClick={handleExportCsv} className="gap-2" aria-label="Download CSV report">
            <Icon name="Download" size={16} />
            Download CSV
          </Button>
          <Button variant="ghost" onClick={handleExportPdf} className="gap-2" aria-label="Download PDF report">
            <Icon name="FileText" size={16} />
            Download PDF
          </Button>
        </div>
      </div>
    </div>
  );
}
