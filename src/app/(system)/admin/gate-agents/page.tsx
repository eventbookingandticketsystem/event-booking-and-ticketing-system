'use client';

import { useState } from "react";
import { StatusPill } from "@/components/Shared/StatusPill";
import { EmptyState } from "@/components/Shared/EmptyState";
import { Modal } from "@/components/Shared/Modal";
import { Button } from "@/components/Shared/Button";
import { Icon } from "@/components/Shared/Icon";
import { ADMIN_AGENTS, AGENT_SCAN_HISTORY } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import type { AdminAgentType } from "@/types/user";

type PageState = "loaded" | "loading" | "empty";

export default function AdminGateAgentsPage() {
  const [state, setState] = useState<PageState>("loaded");
  const [historyAgent, setHistoryAgent] = useState<AdminAgentType | null>(null);
  const [deactivateAgent, setDeactivateAgent] = useState<AdminAgentType | null>(null);

  const rows = state === "empty" ? [] : ADMIN_AGENTS;

  return (
    <div className="flex flex-col min-h-full">
      {/* Demo state toggle */}
      <div className="flex gap-2 px-6 pt-4">
        {(["loaded", "loading", "empty"] as PageState[]).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setState(s)}
            className={cn(
              "px-3 py-1 rounded-sm text-xs font-semibold border transition-colors",
              state === s
                ? "bg-brand-navy text-white border-brand-navy"
                : "border-border text-text-secondary hover:border-brand-navy/30",
            )}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="px-6 pt-5 pb-10 flex flex-col gap-5">
        {/* Page header */}
        <div>
          <h1 className="font-display font-bold text-[26px] text-text mb-0.5">Gate agents</h1>
          <p className="text-sm text-text-secondary">Every scanning agent across all events.</p>
        </div>

        {/* Empty state */}
        {state === "empty" && (
          <div className="bg-surface border border-border rounded-lg p-6">
            <EmptyState
              icon="Users"
              heading="No gate agents registered yet"
              subtext="Agents appear here once organizers assign them to events."
            />
          </div>
        )}

        {/* Table */}
        {state !== "empty" && (
          <div className="bg-surface border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm" aria-label="Gate agents table">
                <thead>
                  <tr className="border-b border-border bg-surface-bg">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Name</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Phone</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Assigned event</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Last active</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Scans today</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Status</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {state === "loading"
                    ? Array.from({ length: 4 }).map((_, i) => (
                        <tr key={i} className="border-b border-border/50">
                          <td className="px-5 py-4"><div className="h-4 w-28 skeleton rounded" /></td>
                          <td className="px-4 py-4"><div className="h-3 w-28 skeleton rounded" /></td>
                          <td className="px-4 py-4"><div className="h-3 w-32 skeleton rounded" /></td>
                          <td className="px-4 py-4"><div className="h-3 w-16 skeleton rounded" /></td>
                          <td className="px-4 py-4"><div className="h-3 w-10 skeleton rounded" /></td>
                          <td className="px-4 py-4"><div className="h-5 w-16 skeleton rounded-pill" /></td>
                          <td className="px-5 py-4 text-right"><div className="h-7 w-20 skeleton rounded ml-auto" /></td>
                        </tr>
                      ))
                    : rows.map((a) => (
                        <tr key={a.id} className="border-b border-border/50 last:border-b-0 hover:bg-surface-bg/50">
                          <td className="px-5 py-3.5 font-semibold">{a.name}</td>
                          <td className="px-4 py-3.5 font-mono text-[13px]">{a.phone}</td>
                          <td className="px-4 py-3.5 text-text-muted max-w-[180px] truncate">{a.event}</td>
                          <td className="px-4 py-3.5 text-text-muted">{a.lastActive}</td>
                          <td className="px-4 py-3.5 font-mono text-[13px]">{a.scansToday.toLocaleString()}</td>
                          <td className="px-4 py-3.5"><StatusPill status={a.status} /></td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                aria-label={`View scan history for ${a.name}`}
                                onClick={() => setHistoryAgent(a)}
                                className="w-8 h-8 rounded border border-border text-text-secondary inline-flex items-center justify-center hover:border-brand-orange/40 hover:text-brand-orange transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
                              >
                                <Icon name="History" size={15} />
                              </button>
                              <button
                                type="button"
                                aria-label={`Deactivate ${a.name}`}
                                onClick={() => setDeactivateAgent(a)}
                                className="w-8 h-8 rounded border border-border text-text-secondary inline-flex items-center justify-center hover:border-status-danger/40 hover:text-status-danger transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-danger"
                              >
                                <Icon name="Power" size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Scan history modal */}
      {historyAgent && (
        <Modal
          open
          title={`${historyAgent.name} — scan history`}
          description={historyAgent.event}
          onClose={() => setHistoryAgent(null)}
          footer={<Button variant="ghost" onClick={() => setHistoryAgent(null)}>Close</Button>}
        >
          <div className="flex flex-col gap-0 -mx-1">
            {AGENT_SCAN_HISTORY.map((s, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-1 py-2.5 border-b border-border/50 last:border-b-0"
              >
                <span className="font-mono text-[13px] text-text-secondary w-16 shrink-0">{s.time}</span>
                <span className="text-[13px] text-text flex-1">{s.event}</span>
                {s.result === "ADMIT" ? (
                  <StatusPill status="Admitted" />
                ) : (
                  <StatusPill status="Rejected" />
                )}
                <span className="font-mono text-[12px] text-text-muted w-[116px] text-right shrink-0">{s.id}</span>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {/* Deactivate confirm modal */}
      {deactivateAgent && (
        <Modal
          open
          title={`Deactivate ${deactivateAgent.name}?`}
          description="They will be signed out of the scanner and unable to validate tickets."
          onClose={() => setDeactivateAgent(null)}
          footer={
            <>
              <Button variant="ghost" onClick={() => setDeactivateAgent(null)}>Cancel</Button>
              <Button variant="danger" className="gap-2" onClick={() => setDeactivateAgent(null)}>
                <Icon name="Power" size={15} />
                Deactivate
              </Button>
            </>
          }
        >
          <p className="text-sm text-text-secondary">You can reactivate them at any time.</p>
        </Modal>
      )}
    </div>
  );
}
