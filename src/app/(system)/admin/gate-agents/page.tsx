'use client';

import { useState } from "react";
import { StatusPill } from "@/components/Shared/StatusPill";
import { EmptyState } from "@/components/Shared/EmptyState";
import { AlertBanner } from "@/components/Shared/AlertBanner";
import { SkeletonCard } from "@/components/Shared/SkeletonCard";
import { Modal } from "@/components/Shared/Modal";
import { Button } from "@/components/Shared/Button";
import { Icon } from "@/components/Shared/Icon";
import { useAgents } from "@/lib/api/hooks/useAgents";
import { useUpdateAgent } from "@/lib/api/hooks/useUpdateAgent";
import { initials } from "@/components/Organizer/OrgTopbar";
import type { GateAgentType } from "@/types/user";

// The admin gate-agents page shows ALL agents across all organizers (admin JWT).
// useAgents with no params → GET /api/agents (admin role sees all via no owner filter).
// Fields lastActive / scansToday come from the raw ApiGateAgent shape but are
// currently null/0 in seed data — displayed as "—" / 0 until agents scan.

export default function AdminGateAgentsPage() {
  const [historyAgent,  setHistoryAgent]  = useState<GateAgentType | null>(null);
  const [toggleTarget,  setToggleTarget]  = useState<GateAgentType | null>(null);

  const { data: agents = [], isLoading, isError, error } = useAgents({ limit: 50 });
  const updateAgent = useUpdateAgent(String(toggleTarget?.id ?? ""));

  const confirmToggle = async () => {
    if (!toggleTarget) return;
    const newStatus = toggleTarget.status === "Active" ? "INACTIVE" : "ACTIVE";
    try {
      await updateAgent.mutateAsync({ status: newStatus });
      setToggleTarget(null);
    } catch {
      // Error shown in modal via updateAgent.isError
    }
  };

  return (
    <div className="flex flex-col min-h-full">
      <div className="px-6 pt-5 pb-10 flex flex-col gap-5">
        {/* Page header */}
        <div>
          <h1 className="font-display font-bold text-[26px] text-text mb-0.5">Gate agents</h1>
          <p className="text-sm text-text-secondary">Every scanning agent across all events.</p>
        </div>

        {/* Error */}
        {isError && (
          <AlertBanner
            tone="danger"
            title="Could not load agents"
            message={error?.message ?? "Please try again."}
          />
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col gap-3">
            {[0,1,2,3].map((i) => <SkeletonCard key={i} className="h-12" />)}
          </div>
        )}

        {/* Empty */}
        {!isLoading && !isError && agents.length === 0 && (
          <div className="bg-surface border border-border rounded-lg p-6">
            <EmptyState
              icon="Users"
              heading="No gate agents registered yet"
              subtext="Agents appear here once organizers assign them to events."
            />
          </div>
        )}

        {/* Table */}
        {!isLoading && !isError && agents.length > 0 && (
          <div className="bg-surface border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm" aria-label="Gate agents table">
                <thead>
                  <tr className="border-b border-border bg-surface-bg">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Name</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Phone</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Assigned event</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Gate</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Status</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {agents.map((a) => (
                    <tr key={String(a.id)} className="border-b border-border/50 last:border-b-0 hover:bg-surface-bg/50">
                      <td className="px-5 py-3.5 font-semibold">
                        <div className="flex items-center gap-2.5">
                          {a.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={a.image} alt={a.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
                          ) : (
                            <div
                              className="w-8 h-8 rounded-full bg-brand-navy/10 text-brand-navy flex items-center justify-center text-[11px] font-bold shrink-0 select-none"
                              aria-hidden="true"
                            >
                              {initials(a.name)}
                            </div>
                          )}
                          <span>{a.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-[13px]">{a.phone}</td>
                      <td className="px-4 py-3.5 text-text-muted max-w-45 truncate">{a.event}</td>
                      <td className="px-4 py-3.5 text-text-secondary">{a.gate}</td>
                      <td className="px-4 py-3.5">
                        <StatusPill status={a.status as Parameters<typeof StatusPill>[0]["status"]} />
                      </td>
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
                            aria-label={a.status === "Active" ? `Deactivate ${a.name}` : `Reactivate ${a.name}`}
                            onClick={() => setToggleTarget(a)}
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

      {/* Scan history modal — no real scan history per-agent in API yet */}
      {historyAgent && (
        <Modal
          open
          title={`${historyAgent.name} — scan history`}
          description={historyAgent.event}
          onClose={() => setHistoryAgent(null)}
          footer={<Button variant="ghost" onClick={() => setHistoryAgent(null)}>Close</Button>}
        >
          <div className="py-6">
            <EmptyState
              icon="ScanLine"
              heading="Scan history coming soon"
              subtext="Per-agent scan history will be available once the scanner runtime is wired."
            />
          </div>
        </Modal>
      )}

      {/* Deactivate / reactivate confirm modal */}
      {toggleTarget && (
        <Modal
          open
          title={toggleTarget.status === "Active" ? `Deactivate ${toggleTarget.name}?` : `Reactivate ${toggleTarget.name}?`}
          description={
            toggleTarget.status === "Active"
              ? "They will be signed out of the scanner and unable to validate tickets."
              : "They will be able to sign back in and validate tickets."
          }
          onClose={() => { if (!updateAgent.isPending) { setToggleTarget(null); updateAgent.reset(); } }}
          footer={
            <>
              <Button
                variant="ghost"
                onClick={() => { setToggleTarget(null); updateAgent.reset(); }}
                disabled={updateAgent.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                className="gap-2"
                onClick={confirmToggle}
                disabled={updateAgent.isPending}
              >
                {updateAgent.isPending ? (
                  <>
                    <Icon name="Loader" size={15} className="animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Icon name="Power" size={15} />
                    {toggleTarget.status === "Active" ? "Deactivate" : "Reactivate"}
                  </>
                )}
              </Button>
            </>
          }
        >
          {updateAgent.isError && (
            <AlertBanner
              tone="danger"
              title="Update failed"
              message={updateAgent.error?.message ?? "Please try again."}
            />
          )}
          {!updateAgent.isError && toggleTarget.status === "Active" && (
            <p className="text-sm text-text-secondary">You can reactivate them at any time.</p>
          )}
        </Modal>
      )}
    </div>
  );
}
