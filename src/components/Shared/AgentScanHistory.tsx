import { useAgentScans } from "@/lib/api/hooks/useAgents";
import { EmptyState } from "@/components/Shared/EmptyState";
import { AlertBanner } from "@/components/Shared/AlertBanner";
import { Icon } from "@/components/Shared/Icon";
import { cn } from "@/lib/utils";
import type { ApiAgentScanRecord } from "@/lib/api/types";

const RESULT_META: Record<ApiAgentScanRecord["result"], { label: string; icon: "CircleCheck" | "CircleX" | "TriangleAlert"; className: string }> = {
  ADMIT:        { label: "Admitted",     icon: "CircleCheck",   className: "text-status-success" },
  ALREADY_USED: { label: "Already used", icon: "TriangleAlert", className: "text-status-warning" },
  WRONG_EVENT:  { label: "Wrong event",  icon: "CircleX",       className: "text-status-danger" },
  EXPIRED:      { label: "Expired",      icon: "CircleX",       className: "text-status-danger" },
  INVALID:      { label: "Invalid",      icon: "CircleX",       className: "text-status-danger" },
};

function formatScanTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

/** Per-agent scan history list — shared by the admin and organizer gate-agents pages. */
export function AgentScanHistory({ agentId }: { agentId: string | null }) {
  const { data: scans, isLoading, isError, error } = useAgentScans(agentId);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 py-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-12 rounded-md skeleton" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <AlertBanner
        tone="danger"
        title="Could not load scan history"
        message={error?.message ?? "Please try again."}
      />
    );
  }

  if (!scans || scans.length === 0) {
    return (
      <div className="py-6">
        <EmptyState
          icon="ScanLine"
          heading="No scans yet"
          subtext="Scans this agent performs at the gate will show up here."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5 py-1 max-h-[360px] overflow-y-auto">
      {scans.map((s) => {
        const meta = RESULT_META[s.result];
        return (
          <div
            key={s.id}
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-md border border-border bg-surface-bg"
          >
            <Icon name={meta.icon} size={16} className={cn("shrink-0", meta.className)} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className={cn("text-sm font-semibold", meta.className)}>{meta.label}</span>
                {s.ticketRef && (
                  <span className="text-xs font-mono text-text-muted truncate">{s.ticketRef}</span>
                )}
              </div>
              {s.note && (
                <div className="text-xs text-text-muted truncate">{s.note}</div>
              )}
            </div>
            <div className="shrink-0 text-right">
              <div className="text-xs text-text-secondary">{formatScanTime(s.scannedAt)}</div>
              <div className="text-[11px] text-text-muted">{s.gate}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
