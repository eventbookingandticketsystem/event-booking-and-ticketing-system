'use client';

import { useState } from "react";
import { OrgTopbar } from "@/components/Organizer/OrgTopbar";
import { Modal } from "@/components/Shared/Modal";
import { StatusPill } from "@/components/Shared/StatusPill";
import { AlertBanner } from "@/components/Shared/AlertBanner";
import { EmptyState } from "@/components/Shared/EmptyState";
import { SkeletonCard } from "@/components/Shared/SkeletonCard";
import { Button } from "@/components/Shared/Button";
import { Icon } from "@/components/Shared/Icon";
import { PhoneInput } from "@/components/Shared/PhoneInput";
import { DEFAULT_PHONE, type PhoneValue } from "@/constants/countries";
import { cn } from "@/lib/utils";
import { useAgents, useCreateAgent } from "@/lib/api/hooks/useAgents";
import { useUpdateAgent, useDeleteAgent } from "@/lib/api/hooks/useUpdateAgent";
import { useOrgEvents } from "@/lib/api/hooks/useOrgEvents";
import { initials } from "@/components/Organizer/OrgTopbar";
import type { GateAgentType } from "@/types/user";
import type { ApiCreatedAgent } from "@/lib/api/types";

export default function OrgAgentsPage() {
  const [addModal,      setAddModal]      = useState(false);
  const [deleteTarget,  setDeleteTarget]  = useState<GateAgentType | null>(null);
  const [toggleTarget,  setToggleTarget]  = useState<GateAgentType | null>(null);
  // Credentials modal shown after successful agent creation
  const [createdAgent,  setCreatedAgent]  = useState<ApiCreatedAgent | null>(null);
  const [pwCopied,      setPwCopied]      = useState(false);

  // ── Data ──────────────────────────────────────────────────────────────────
  const { data: agents = [], isLoading, isError, error } = useAgents();
  const { data: events = [] } = useOrgEvents({ limit: 50 });
  const createAgent = useCreateAgent();
  const deleteAgent = useDeleteAgent(String(deleteTarget?.id ?? ""));
  const updateAgent = useUpdateAgent(String(toggleTarget?.id ?? ""));

  // ── Add form state ─────────────────────────────────────────────────────────
  const [agentName,    setAgentName]    = useState("");
  const [agentPhone,   setAgentPhone]   = useState<PhoneValue>(DEFAULT_PHONE);
  const [agentEventId, setAgentEventId] = useState("");
  const [agentGate,    setAgentGate]    = useState("");
  const [formTouched,  setFormTouched]  = useState(false);

  const nameErr  = formTouched && !agentName.trim()  ? "Name is required"  : "";
  const eventErr = formTouched && !agentEventId      ? "Event is required" : "";

  const handleAdd = async () => {
    setFormTouched(true);
    if (!agentName.trim() || !agentEventId) return;
    try {
      const result = await createAgent.mutateAsync({
        name:    agentName.trim(),
        phone:   `${agentPhone.dial}${agentPhone.num}`,
        gate:    agentGate.trim() || "Gate A",
        eventId: agentEventId,
      });
      // Show credentials modal
      setCreatedAgent(result);
      handleAddClose();
    } catch {
      // Error shown via createAgent.isError
    }
  };

  const handleAddClose = () => {
    setAddModal(false);
    setFormTouched(false);
    setAgentName("");
    setAgentPhone(DEFAULT_PHONE);
    setAgentEventId("");
    setAgentGate("");
    createAgent.reset();
  };

  const handleCopyPassword = () => {
    if (!createdAgent) return;
    navigator.clipboard.writeText(createdAgent.generatedPassword).catch(() => {});
    setPwCopied(true);
    setTimeout(() => setPwCopied(false), 2000);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteAgent.mutateAsync();
      setDeleteTarget(null);
    } catch {
      // Error shown in modal
    }
  };

  const confirmToggle = async () => {
    if (!toggleTarget) return;
    const newStatus = toggleTarget.status === "Active" ? "INACTIVE" : "ACTIVE";
    try {
      await updateAgent.mutateAsync({ status: newStatus });
      setToggleTarget(null);
    } catch {
      // Error shown in modal
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col min-h-full">
        <OrgTopbar crumb="Gate Agents" />
        <div className="px-6 pt-5 pb-10 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="h-8 w-40 skeleton rounded" />
            <div className="h-9 w-28 skeleton rounded" />
          </div>
          <SkeletonCard className="h-12" />
          <SkeletonCard className="h-12" />
          <SkeletonCard className="h-12" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <OrgTopbar crumb="Gate Agents" />

      <div className="px-6 pt-5 pb-10 flex flex-col gap-5">
        {/* Page header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display font-bold text-[26px] text-text mb-0.5">Gate agents</h1>
            <p className="text-sm text-text-secondary">People authorised to scan tickets at your events.</p>
          </div>
          <Button
            onClick={() => setAddModal(true)}
            className="gap-2 shrink-0"
            aria-label="Add gate agent"
          >
            <Icon name="UserPlus" size={16} />
            Add agent
          </Button>
        </div>

        {/* Error state */}
        {isError && (
          <AlertBanner
            tone="danger"
            title="Could not load agents"
            message={error?.message ?? "Please try again."}
          />
        )}

        {/* Empty or table */}
        {!isError && agents.length === 0 ? (
          <div className="bg-surface border border-border rounded-lg p-6">
            <EmptyState
              icon="Users"
              heading="No gate agents added"
              subtext="Add agents to enable event gate scanning."
              cta={
                <Button size="sm" onClick={() => setAddModal(true)} className="mt-1 gap-2">
                  <Icon name="UserPlus" size={15} />
                  Add agent
                </Button>
              }
            />
          </div>
        ) : !isError ? (
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
                      {/* Name with avatar */}
                      <td className="px-5 py-4 font-semibold">
                        <div className="flex items-center gap-2.5">
                          {a.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={a.image}
                              alt={a.name}
                              className="w-8 h-8 rounded-full object-cover shrink-0"
                            />
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
                      <td className="px-4 py-4 font-mono text-[13px]">{a.phone}</td>
                      <td className="px-4 py-4 text-text-muted max-w-[180px] truncate">{a.event}</td>
                      <td className="px-4 py-4 text-text-secondary">{a.gate}</td>
                      <td className="px-4 py-4">
                        <StatusPill status={a.status as Parameters<typeof StatusPill>[0]["status"]} />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {/* Toggle status */}
                          <button
                            type="button"
                            onClick={() => setToggleTarget(a)}
                            aria-label={a.status === "Active" ? `Deactivate ${a.name}` : `Activate ${a.name}`}
                            title={a.status === "Active" ? "Deactivate" : "Activate"}
                            className={cn(
                              "w-8 h-8 rounded border border-border text-text-secondary inline-flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange",
                              a.status === "Active"
                                ? "hover:border-status-warning/40 hover:text-status-warning"
                                : "hover:border-status-success/40 hover:text-status-success",
                            )}
                          >
                            <Icon name={a.status === "Active" ? "CirclePause" : "CirclePlay"} size={15} />
                          </button>
                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(a)}
                            aria-label={`Remove ${a.name}`}
                            title="Remove agent"
                            className="w-8 h-8 rounded border border-border text-text-secondary inline-flex items-center justify-center hover:border-status-danger/40 hover:text-status-danger transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-danger"
                          >
                            <Icon name="Trash2" size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center px-5 py-3 border-t border-border bg-surface-bg">
              <span className="text-xs text-text-muted">
                {agents.length} agent{agents.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        ) : null}
      </div>

      {/* ══════════════════════════════════════════════════════════
          ADD AGENT MODAL
      ══════════════════════════════════════════════════════════ */}
      {addModal && (
        <Modal
          open={addModal}
          title="Add gate agent"
          description="A login will be created for them automatically."
          onClose={handleAddClose}
          footer={
            <>
              <Button variant="ghost" onClick={handleAddClose} disabled={createAgent.isPending}>
                Cancel
              </Button>
              <Button
                onClick={handleAdd}
                disabled={createAgent.isPending}
                className="gap-2"
                aria-label="Confirm add gate agent"
              >
                {createAgent.isPending ? (
                  <>
                    <Icon name="Loader" size={15} className="animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Icon name="UserPlus" size={15} />
                    Add agent
                  </>
                )}
              </Button>
            </>
          }
        >
          <div className="flex flex-col gap-4 py-2">
            {createAgent.isError && (
              <AlertBanner
                tone="danger"
                title="Failed to add agent"
                message={createAgent.error?.message ?? "Please try again."}
              />
            )}

            {/* Name */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="agent-name" className="text-sm font-semibold text-text font-body">
                Full name
              </label>
              <input
                id="agent-name"
                type="text"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                placeholder="e.g. Alex Johnson"
                aria-label="Full name"
                aria-invalid={!!nameErr}
                className={cn(
                  "w-full h-11 px-3.5 rounded-sm border bg-white text-text text-[15px] font-body transition-colors",
                  "placeholder:text-text-muted focus:outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20",
                  nameErr ? "border-status-danger" : "border-border",
                )}
              />
              {nameErr && (
                <p role="alert" className="text-xs text-status-danger font-semibold">{nameErr}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <div className="text-sm font-semibold text-text font-body mb-1.5">Phone number</div>
              <PhoneInput value={agentPhone} onChange={setAgentPhone} />
            </div>

            {/* Assigned event */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="agent-event" className="text-sm font-semibold text-text font-body">
                Assigned event
              </label>
              <div className="relative">
                <select
                  id="agent-event"
                  value={agentEventId}
                  onChange={(e) => setAgentEventId(e.target.value)}
                  aria-label="Assigned event"
                  aria-invalid={!!eventErr}
                  className={cn(
                    "w-full h-11 px-3.5 pr-9 rounded-sm border bg-white text-text text-[15px] font-body appearance-none",
                    "focus:outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20",
                    eventErr ? "border-status-danger" : "border-border",
                    !agentEventId && "text-text-muted",
                  )}
                >
                  <option value="" disabled>Select an event</option>
                  {events.map((e) => (
                    <option key={String(e.id)} value={String(e.id)}>{e.name}</option>
                  ))}
                </select>
                <Icon
                  name="ChevronDown"
                  size={16}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
                />
              </div>
              {eventErr && (
                <p role="alert" className="text-xs text-status-danger font-semibold">{eventErr}</p>
              )}
            </div>

            {/* Gate */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="agent-gate" className="text-sm font-semibold text-text font-body">
                Gate / position
              </label>
              <input
                id="agent-gate"
                type="text"
                value={agentGate}
                onChange={(e) => setAgentGate(e.target.value)}
                placeholder="e.g. Gate A"
                aria-label="Gate / position"
                className="w-full h-11 px-3.5 rounded-sm border border-border bg-white text-text text-[15px] font-body placeholder:text-text-muted focus:outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20"
              />
            </div>
          </div>
        </Modal>
      )}

      {/* ══════════════════════════════════════════════════════════
          CREDENTIALS MODAL — shown once after agent is created
      ══════════════════════════════════════════════════════════ */}
      {createdAgent && (
        <Modal
          open
          title="Agent account created"
          description="Share these login details with the gate agent. The password cannot be shown again."
          onClose={() => setCreatedAgent(null)}
          footer={
            <Button onClick={() => setCreatedAgent(null)} className="gap-2">
              <Icon name="Check" size={15} />
              Done
            </Button>
          }
        >
          <div className="flex flex-col gap-4 py-2">
            {/* Info banner */}
            <AlertBanner
              tone="info"
              message="The agent signs in at /login with their phone number and the password below."
            />

            {/* Agent summary */}
            <div className="flex items-center gap-3 px-4 py-3 bg-surface-bg rounded-md border border-border">
              <div className="w-10 h-10 rounded-full bg-brand-navy/10 text-brand-navy flex items-center justify-center text-sm font-bold shrink-0 select-none">
                {initials(createdAgent.name)}
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-text">{createdAgent.name}</div>
                <div className="text-xs text-text-secondary font-mono">{createdAgent.phone}</div>
              </div>
              <div className="ml-auto text-right">
                <div className="text-xs text-text-muted">Gate</div>
                <div className="font-semibold text-text text-sm">{createdAgent.gate}</div>
              </div>
            </div>

            {/* Credentials */}
            <div className="flex flex-col gap-3">
              {/* Phone (login) */}
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Login phone</span>
                <div className="flex items-center gap-2 px-3.5 h-11 bg-surface-bg border border-border rounded-sm">
                  <span className="flex-1 font-mono text-[15px] text-text">{createdAgent.phone}</span>
                </div>
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Password (one time)</span>
                <div className="flex items-center gap-2 px-3.5 h-11 bg-status-warning-bg border border-status-warning/30 rounded-sm">
                  <span className="flex-1 font-mono text-[17px] font-bold tracking-widest text-text">{createdAgent.generatedPassword}</span>
                  <button
                    type="button"
                    onClick={handleCopyPassword}
                    aria-label="Copy password"
                    className="shrink-0 text-text-secondary hover:text-text transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange rounded"
                  >
                    {pwCopied
                      ? <Icon name="Check" size={16} className="text-status-success" />
                      : <Icon name="Copy" size={16} />
                    }
                  </button>
                </div>
                <p className="text-[11px] text-status-warning font-semibold flex items-center gap-1">
                  <Icon name="TriangleAlert" size={12} />
                  This password will not be shown again. Copy it now.
                </p>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* ══════════════════════════════════════════════════════════
          TOGGLE STATUS CONFIRM MODAL
      ══════════════════════════════════════════════════════════ */}
      {toggleTarget && (
        <Modal
          open
          title={toggleTarget.status === "Active" ? "Deactivate agent?" : "Activate agent?"}
          description={
            toggleTarget.status === "Active"
              ? `${toggleTarget.name} will no longer be able to scan tickets.`
              : `${toggleTarget.name} will be able to scan tickets again.`
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
                onClick={confirmToggle}
                disabled={updateAgent.isPending}
                className="gap-2"
                aria-label="Confirm status change"
              >
                {updateAgent.isPending ? (
                  <>
                    <Icon name="Loader" size={15} className="animate-spin" />
                    Updating...
                  </>
                ) : toggleTarget.status === "Active" ? (
                  <>
                    <Icon name="CirclePause" size={15} />
                    Deactivate
                  </>
                ) : (
                  <>
                    <Icon name="CirclePlay" size={15} />
                    Activate
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
        </Modal>
      )}

      {/* ══════════════════════════════════════════════════════════
          DELETE CONFIRM MODAL
      ══════════════════════════════════════════════════════════ */}
      {deleteTarget && (
        <Modal
          open
          title="Remove agent?"
          description={`${deleteTarget.name} will be permanently removed and lose access to all scanner sessions.`}
          onClose={() => { if (!deleteAgent.isPending) { setDeleteTarget(null); deleteAgent.reset(); } }}
          footer={
            <>
              <Button
                variant="ghost"
                onClick={() => { setDeleteTarget(null); deleteAgent.reset(); }}
                disabled={deleteAgent.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDelete}
                disabled={deleteAgent.isPending}
                className="gap-2 bg-status-danger hover:bg-status-danger/90 border-status-danger"
                aria-label="Confirm remove agent"
              >
                {deleteAgent.isPending ? (
                  <>
                    <Icon name="Loader" size={15} className="animate-spin" />
                    Removing...
                  </>
                ) : (
                  <>
                    <Icon name="Trash2" size={15} />
                    Yes, remove
                  </>
                )}
              </Button>
            </>
          }
        >
          {deleteAgent.isError && (
            <AlertBanner
              tone="danger"
              title="Could not remove agent"
              message={deleteAgent.error?.message ?? "Please try again."}
            />
          )}
        </Modal>
      )}
    </div>
  );
}
