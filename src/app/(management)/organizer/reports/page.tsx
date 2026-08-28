'use client';

import { useState, useCallback } from "react";
import { OrgTopbar }   from "@/components/Organizer/OrgTopbar";
import { StatCard }    from "@/components/Shared/StatCard";
import { LineChart }   from "@/components/Shared/LineChart";
import { HBarChart }   from "@/components/Shared/HBarChart";
import { StatusPill }  from "@/components/Shared/StatusPill";
import { Button }      from "@/components/Shared/Button";
import { Icon }        from "@/components/Shared/Icon";
import { SkeletonCard } from "@/components/Shared/SkeletonCard";
import { useOrgEvents }  from "@/lib/api/hooks/useOrgEvents";
import { useOrgReport }  from "@/lib/api/hooks/useOrgReport";
import type { ApiOrgReport } from "@/lib/api/types";

// ── CSV / PDF helpers ─────────────────────────────────────────────────────────

function escapeCsv(v: string | number): string {
  const s = String(v);
  return s.includes(",") || s.includes('"') || s.includes("\n")
    ? `"${s.replace(/"/g, '""')}"`
    : s;
}

function buildCsvRows(headers: string[], rows: (string | number)[][]): string {
  return [
    headers.map(escapeCsv).join(","),
    ...rows.map((r) => r.map(escapeCsv).join(",")),
  ].join("\n");
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

function labelReason(r: string) {
  switch (r) {
    case "USED":        return "Already Used";
    case "INVALID":     return "Invalid Ticket";
    case "WRONG_EVENT": return "Wrong Event";
    case "EXPIRED":     return "Expired";
    case "TOO_EARLY":   return "Too Early";
    case "EVENT_ENDED": return "Event Ended";
    case "REJECT":      return "Rejected";
    default:            return r;
  }
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function ReportSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading report">
      {/* Stat cards skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <SkeletonCard key={i} variant="stat" />
        ))}
      </div>
      {/* Chart skeleton */}
      <div className="bg-surface border border-border rounded-lg p-5">
        <div className="skeleton rounded h-50 w-full" />
      </div>
      {/* 2-col */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="skeleton rounded h-55 w-full" />
        <div className="skeleton rounded h-55 w-full" />
      </div>
    </div>
  );
}

// ── Empty (no event selected) ─────────────────────────────────────────────────

function NoEventSelected() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <span className="flex items-center justify-center w-16 h-16 rounded-full bg-surface-bg border border-border">
        <Icon name="ChartBar" size={32} className="text-text-muted" />
      </span>
      <div>
        <p className="font-display font-semibold text-[18px] text-text mb-1">Select an event</p>
        <p className="text-sm text-text-secondary max-w-xs mx-auto">
          Choose an event from the dropdown above to view post-event analytics,
          attendance data, and fraud reports.
        </p>
      </div>
    </div>
  );
}

// ── No data state ─────────────────────────────────────────────────────────────

function NoReportData({ eventName }: { eventName: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <span className="flex items-center justify-center w-16 h-16 rounded-full bg-surface-bg border border-border">
        <Icon name="CalendarX2" size={32} className="text-text-muted" />
      </span>
      <div>
        <p className="font-display font-semibold text-[18px] text-text mb-1">No scan data yet</p>
        <p className="text-sm text-text-secondary max-w-xs mx-auto">
          No gate scans have been recorded for <span className="font-medium text-text">{eventName}</span> yet.
          Report data will appear once the event starts and gate agents begin scanning tickets.
        </p>
      </div>
    </div>
  );
}

// ── Main report body ──────────────────────────────────────────────────────────

function ReportBody({
  report,
  onExportCsv,
  onExportPdf,
}: {
  report: ApiOrgReport;
  onExportCsv: () => void;
  onExportPdf: () => void;
}) {
  const lineData = report.entryRate.map((pt) => ({ label: pt.t, value: pt.v }));

  const TIER_COLORS = [
    "#FF5A00", "#0F3349", "#1A6B3C", "#466177", "#7A4A00",
    "#A32D2D", "#CC4800", "#08283B",
  ];
  const barData = report.tiers.map((t, i) => ({
    label: t.name,
    value: t.sold,
    color: TIER_COLORS[i % TIER_COLORS.length],
  }));

  return (
    <>
      {/* 4 stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Attended"
          value={report.attended.toLocaleString()}
          chipIcon={<Icon name="Users" size={17} />}
          footText="Validated entries"
        />
        <StatCard
          label="Total Revenue"
          value={`$${report.revenue.toLocaleString("en-US")}`}
          chipIcon={<Icon name="TrendingUp" size={17} />}
          chipBg="bg-status-success-bg"
          chipFg="text-status-success"
          footDot="bg-status-success"
          footText="Gross sales"
        />
        <StatCard
          label="Fraud Attempts"
          value={String(report.fraud)}
          chipIcon={<Icon name="ShieldAlert" size={17} />}
          chipBg="bg-status-danger-bg"
          chipFg="text-status-danger"
          footDot="bg-status-danger"
          footText="Rejected at gate"
        />
        <StatCard
          label="Scan Duration"
          value={report.duration}
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
        {lineData.length > 0
          ? <LineChart data={lineData} />
          : <p className="text-sm text-text-muted text-center py-8">No timeline data recorded yet.</p>
        }
      </div>

      {/* 2-col: tier breakdown + fraud table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Tier breakdown */}
        <div className="bg-surface border border-border rounded-lg p-5">
          <h3 className="font-display font-semibold text-[17px] text-text mb-3 m-0">Tier breakdown</h3>
          {barData.length > 0
            ? <HBarChart data={barData} />
            : <p className="text-sm text-text-muted text-center py-8">No tier data available.</p>
          }
        </div>

        {/* Fraud table */}
        <div className="bg-surface border border-border rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h3 className="font-display font-semibold text-[17px] text-text m-0">Fraud attempts</h3>
            {report.fraud > 0 && (
              <span className="text-sm font-medium text-status-danger">{report.fraud} total</span>
            )}
          </div>
          {report.fraudRows.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center px-4">
              <Icon name="ShieldCheck" size={28} className="text-status-success" />
              <p className="text-sm text-text-secondary">No fraud attempts recorded.</p>
            </div>
          ) : (
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
                  {report.fraudRows.map((x, i) => (
                    <tr key={i} className="border-b border-border/50 last:border-b-0 hover:bg-surface-bg/50">
                      <td className="px-4 py-3 font-mono text-[13px]">{x.time}</td>
                      <td className="px-4 py-3 text-text-secondary">{x.gate}</td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1.5">
                          <StatusPill status="Rejected" />
                          <span className="text-[13px] text-text-secondary">{labelReason(x.reason)}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-[13px] text-text-muted">{x.ticketRef}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Export buttons */}
      <div className="flex justify-end gap-3">
        <Button variant="ghost" onClick={onExportCsv} className="gap-2" aria-label="Download CSV report">
          <Icon name="Download" size={16} />
          Download CSV
        </Button>
        <Button variant="ghost" onClick={onExportPdf} className="gap-2" aria-label="Download PDF report">
          <Icon name="FileText" size={16} />
          Download PDF
        </Button>
      </div>
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function OrgReportsPage() {
  const [selectedEventId, setSelectedEventId] = useState("");

  const { data: events = [] } = useOrgEvents({ limit: 100 });
  const { data: report, isLoading, isError } = useOrgReport(selectedEventId || undefined);

  const selectedEvent = events.find((e) => String(e.id) === selectedEventId);
  const displayName   = report?.eventName ?? selectedEvent?.name ?? "—";

  // ── Export handlers (use live report data) ────────────────────────────────

  const handleExportCsv = useCallback(() => {
    if (!report) return;
    const date     = new Date().toLocaleDateString("en-GB");

    const summaryRows: (string | number)[][] = [
      ["Event",          displayName],
      ["Export date",    date],
      ["Total attended", report.attended],
      ["Total revenue",  `$${report.revenue.toLocaleString("en-US")}`],
      ["Fraud attempts", report.fraud],
      ["Scan duration",  report.duration],
    ];

    const rateRows    = report.entryRate.map((pt) => [pt.t, pt.v] as (string | number)[]);
    const tierRows    = report.tiers.map((t) => [t.name, t.sold, t.capacity] as (string | number)[]);
    const fraudTableRows = report.fraudRows.map(
      (x) => [x.time, x.gate, labelReason(x.reason), x.ticketRef] as (string | number)[],
    );

    const csv = [
      "=== SUMMARY ===",
      buildCsvRows(["Metric", "Value"], summaryRows),
      "",
      "=== ENTRY TIMELINE ===",
      buildCsvRows(["Time", "Admissions"], rateRows),
      "",
      "=== TIER BREAKDOWN ===",
      buildCsvRows(["Ticket category", "Admitted", "Capacity"], tierRows),
      "",
      "=== FRAUD ATTEMPTS ===",
      buildCsvRows(["Time", "Gate", "Reason", "Ticket ID"], fraudTableRows),
    ].join("\n");

    const slug = displayName.replace(/\s+/g, "-").toLowerCase().slice(0, 40);
    downloadFile(csv, `tiketi-report-${slug}.csv`, "text/csv;charset=utf-8;");
  }, [report, displayName]);

  const handleExportPdf = useCallback(() => {
    if (!report) return;
    const date = new Date().toLocaleDateString("en-GB", {
      day: "numeric", month: "long", year: "numeric",
    });

    const tierRowsHtml = report.tiers
      .map((t) => `<tr><td>${t.name}</td><td>${t.sold.toLocaleString()}</td><td>${t.capacity.toLocaleString()}</td></tr>`)
      .join("");

    const fraudRowsHtml = report.fraudRows
      .map((x) => `<tr><td>${x.time}</td><td>${x.gate}</td><td>${labelReason(x.reason)}</td><td>${x.ticketRef}</td></tr>`)
      .join("");

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Tiketi Event Report — ${displayName}</title>
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
  <p class="meta">${displayName} &nbsp;·&nbsp; Generated ${date}</p>
  <div class="stats">
    <div class="stat"><div class="stat-label">Total attended</div><div class="stat-value">${report.attended.toLocaleString()}</div></div>
    <div class="stat"><div class="stat-label">Total revenue</div><div class="stat-value">$${report.revenue.toLocaleString("en-US")}</div></div>
    <div class="stat"><div class="stat-label">Fraud attempts</div><div class="stat-value">${report.fraud}</div></div>
    <div class="stat"><div class="stat-label">Scan duration</div><div class="stat-value">${report.duration}</div></div>
  </div>
  <h2>Tier breakdown</h2>
  <table>
    <thead><tr><th>Ticket category</th><th>Admitted</th><th>Capacity</th></tr></thead>
    <tbody>${tierRowsHtml}</tbody>
  </table>
  <h2>Fraud attempts</h2>
  <table>
    <thead><tr><th>Time</th><th>Gate</th><th>Reason</th><th>Ticket ID</th></tr></thead>
    <tbody>${fraudRowsHtml.length ? fraudRowsHtml : "<tr><td colspan='4'>No fraud attempts recorded.</td></tr>"}</tbody>
  </table>
</body>
</html>`;

    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
  }, [report, displayName]);

  return (
    <div className="flex flex-col min-h-full">
      <OrgTopbar crumb="Reports" />

      <div className="px-6 pt-5 pb-10 flex flex-col gap-6">
        {/* Page header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display font-bold text-[26px] text-text mb-0.5">Reports</h1>
            <p className="text-sm text-text-secondary">
              {selectedEventId
                ? <>Post-event analytics for <span className="font-semibold text-text">{displayName}</span></>
                : "Select an event to view post-event analytics"}
            </p>
          </div>

          {/* Event selector — real events from API */}
          <div className="relative shrink-0">
            <Icon
              name="Calendar"
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none"
            />
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              aria-label="Select event for report"
              className="h-9 pl-8 pr-8 border border-border rounded-md bg-surface-bg text-sm font-medium text-text appearance-none focus:outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20"
            >
              <option value="">— Select event —</option>
              {events.map((e) => (
                <option key={String(e.id)} value={String(e.id)}>{e.name}</option>
              ))}
            </select>
            <Icon
              name="ChevronDown"
              size={14}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none"
            />
          </div>
        </div>

        {/* Body */}
        {!selectedEventId ? (
          <NoEventSelected />
        ) : isLoading ? (
          <ReportSkeleton />
        ) : isError ? (
          <div className="flex items-start gap-3 px-4 py-3 rounded-md bg-status-danger-bg border border-status-danger/30 text-sm text-status-danger">
            <Icon name="TriangleAlert" size={16} className="shrink-0 mt-0.5" />
            <span>
              <span className="font-semibold">Failed to load report data.</span>{" "}
              Please try again or select a different event.
            </span>
          </div>
        ) : report && report.attended === 0 && report.fraud === 0 ? (
          <NoReportData eventName={displayName} />
        ) : report ? (
          <ReportBody
            report={report}
            onExportCsv={handleExportCsv}
            onExportPdf={handleExportPdf}
          />
        ) : null}
      </div>
    </div>
  );
}
