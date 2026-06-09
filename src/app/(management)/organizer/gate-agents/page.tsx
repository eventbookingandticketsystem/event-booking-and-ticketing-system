'use client';

import { useState } from "react";
import { OrgTopbar } from "@/components/Organizer/OrgTopbar";
import { Modal } from "@/components/Shared/Modal";
import { StatusPill } from "@/components/Shared/StatusPill";
import { EmptyState } from "@/components/Shared/EmptyState";
import { Button } from "@/components/Shared/Button";
import { Icon } from "@/components/Shared/Icon";
import { PhoneInput } from "@/components/Shared/PhoneInput";
import { DEFAULT_PHONE, type PhoneValue } from "@/constants/countries";
import { GATE_AGENTS, ORG_EVENTS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import type { GateAgentType } from "@/types/user";

export default function OrgAgentsPage() {
  const [modal, setModal] = useState(false);
  const [agents, setAgents] = useState<GateAgentType[]>([...GATE_AGENTS]);

  // Add agent form state
  const [agentName, setAgentName] = useState("");
  const [agentPhone, setAgentPhone] = useState<PhoneValue>(DEFAULT_PHONE);
  const [agentEvent, setAgentEvent] = useState("");
  const [agentGate, setAgentGate] = useState("");
  const [formTouched, setFormTouched] = useState(false);

  const nameErr = formTouched && !agentName.trim() ? "Name is required" : "";
  const eventErr = formTouched && !agentEvent ? "Event is required" : "";

  const handleAdd = () => {
    setFormTouched(true);
    if (!agentName.trim() || !agentEvent) return;
    const newAgent: GateAgentType = {
      id: Date.now(),
      name: agentName.trim(),
      phone: `${agentPhone.dial} ${agentPhone.num}`,
      event: agentEvent,
      gate: agentGate || "Gate A",
      status: "Active",
    };
    setAgents((prev) => [newAgent, ...prev]);
    // Reset form
    setAgentName("");
    setAgentPhone(DEFAULT_PHONE);
    setAgentEvent("");
    setAgentGate("");
    setFormTouched(false);
    setModal(false);
  };

  const handleClose = () => {
    setModal(false);
    setFormTouched(false);
    setAgentName("");
    setAgentPhone(DEFAULT_PHONE);
    setAgentEvent("");
    setAgentGate("");
  };

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
          <Button onClick={() => setModal(true)} className="gap-2 shrink-0" aria-label="Add gate agent">
            <Icon name="UserPlus" size={16} />
            Add agent
          </Button>
        </div>

        {agents.length === 0 ? (
          <div className="bg-surface border border-border rounded-lg p-6">
            <EmptyState
              icon="Users"
              heading="No gate agents added"
              subtext="Add agents to enable event gate scanning."
              cta={
                <Button size="sm" onClick={() => setModal(true)} className="mt-1 gap-2">
                  <Icon name="UserPlus" size={15} />
                  Add agent
                </Button>
              }
            />
          </div>
        ) : (
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
                    <tr key={a.id} className="border-b border-border/50 last:border-b-0 hover:bg-surface-bg/50">
                      <td className="px-5 py-4 font-semibold">{a.name}</td>
                      <td className="px-4 py-4 font-mono text-[13px]">{a.phone}</td>
                      <td className="px-4 py-4 text-text-muted max-w-[180px] truncate">{a.event}</td>
                      <td className="px-4 py-4 text-text-secondary">{a.gate}</td>
                      <td className="px-4 py-4">
                        <StatusPill status={a.status as Parameters<typeof StatusPill>[0]["status"]} />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            aria-label={`Edit ${a.name}`}
                            className="w-8 h-8 rounded border border-border text-text-secondary inline-flex items-center justify-center hover:border-brand-orange/40 hover:text-brand-orange transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
                          >
                            <Icon name="Pencil" size={15} />
                          </button>
                          <button
                            type="button"
                            aria-label={`Remove ${a.name}`}
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
          </div>
        )}
      </div>

      {/* Add Agent Modal */}
      {modal && (
        <Modal
          open={modal}
          title="Add gate agent"
          description="They'll receive a scanner login by SMS."
          onClose={handleClose}
          footer={
            <>
              <Button variant="ghost" onClick={handleClose}>Cancel</Button>
              <Button onClick={handleAdd} className="gap-2">
                <Icon name="UserPlus" size={15} />
                Add agent
              </Button>
            </>
          }
        >
          <div className="flex flex-col gap-4 py-2">
            {/* Name */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="agent-name" className="text-sm font-semibold text-text font-body">Full name</label>
              <input
                id="agent-name"
                type="text"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                placeholder="e.g. James Majok"
                aria-label="Full name"
                aria-invalid={!!nameErr}
                className={cn(
                  "w-full h-11 px-3.5 rounded-sm border bg-white text-text text-[15px] font-body transition-colors",
                  "placeholder:text-text-muted focus:outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20",
                  nameErr ? "border-status-danger" : "border-border",
                )}
              />
              {nameErr && <p role="alert" className="text-xs text-status-danger font-semibold">{nameErr}</p>}
            </div>

            {/* Phone */}
            <div>
              <div className="text-sm font-semibold text-text font-body mb-1.5">Phone number</div>
              <PhoneInput value={agentPhone} onChange={setAgentPhone} />
            </div>

            {/* Assigned event */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="agent-event" className="text-sm font-semibold text-text font-body">Assigned event</label>
              <div className="relative">
                <select
                  id="agent-event"
                  value={agentEvent}
                  onChange={(e) => setAgentEvent(e.target.value)}
                  aria-label="Assigned event"
                  aria-invalid={!!eventErr}
                  className={cn(
                    "w-full h-11 px-3.5 pr-9 rounded-sm border bg-white text-text text-[15px] font-body appearance-none",
                    "focus:outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20",
                    eventErr ? "border-status-danger" : "border-border",
                    !agentEvent && "text-text-muted",
                  )}
                >
                  <option value="" disabled>Select an event</option>
                  {ORG_EVENTS.map((e) => (
                    <option key={e.id} value={e.name}>{e.name}</option>
                  ))}
                </select>
                <Icon name="ChevronDown" size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              </div>
              {eventErr && <p role="alert" className="text-xs text-status-danger font-semibold">{eventErr}</p>}
            </div>

            {/* Gate */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="agent-gate" className="text-sm font-semibold text-text font-body">Gate / position</label>
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
    </div>
  );
}
