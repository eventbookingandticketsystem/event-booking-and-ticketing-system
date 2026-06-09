'use client';

import { useState } from "react";
import { StatusPill } from "@/components/Shared/StatusPill";
import { EmptyState } from "@/components/Shared/EmptyState";
import { Modal } from "@/components/Shared/Modal";
import { Button } from "@/components/Shared/Button";
import { Icon } from "@/components/Shared/Icon";
import { PhoneInput } from "@/components/Shared/PhoneInput";
import { AlertBanner } from "@/components/Shared/AlertBanner";
import { DEFAULT_PHONE, type PhoneValue } from "@/constants/countries";
import { ORGANIZERS, ORG_EVENTS, GATE_AGENTS, ORG_ACTIVITY } from "@/lib/mock-data";
import { formatSSP } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { OrganizerType } from "@/types/user";
import type { OrgEventRow } from "@/types/event";

type PageState = "loaded" | "loading" | "empty";

interface FormState {
  name: string;
  phone: PhoneValue;
  org: string;
}

function AddOrganizerModal({ onClose, existingPhones }: { onClose: () => void; existingPhones: string[] }) {
  const [form, setForm] = useState<FormState>({ name: "", phone: DEFAULT_PHONE, org: "" });
  const [touched, setTouched] = useState(false);

  const phoneFull = `${form.phone.dial}${form.phone.num}`.replace(/\s/g, "");
  const errors = {
    name: !form.name.trim() ? "Full name is required" : "",
    phone: !form.phone.num
      ? "Phone number is required"
      : form.phone.num.length < 7
      ? "Enter a valid phone number"
      : existingPhones.includes(phoneFull)
      ? "This phone number is already registered"
      : "",
    org: !form.org.trim() ? "Organization name is required" : "",
  };
  const isValid = !Object.values(errors).some(Boolean);
  const fieldError = (k: keyof typeof errors) => touched ? errors[k] : "";

  const handleSubmit = () => {
    setTouched(true);
    if (isValid) onClose();
  };

  return (
    <Modal
      open
      title="Add organizer"
      description="They'll receive an invite by SMS to set up their account."
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button className="gap-2" onClick={handleSubmit}>
            <Icon name="Send" size={15} />
            Send invite
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4 py-2">
        {/* Full name */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="org-name" className="text-sm font-semibold text-text font-body">Full name</label>
          <input
            id="org-name"
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Grace Lado"
            aria-label="Full name"
            aria-invalid={!!fieldError("name")}
            className={cn(
              "w-full h-11 px-3.5 rounded-sm border bg-white text-text text-[15px] font-body transition-colors",
              "placeholder:text-text-muted focus:outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20",
              fieldError("name") ? "border-status-danger" : "border-border",
            )}
          />
          {fieldError("name") && <p role="alert" className="text-xs text-status-danger font-semibold">{fieldError("name")}</p>}
        </div>

        {/* Phone */}
        <div>
          <div className="text-sm font-semibold text-text font-body mb-1.5">Phone number</div>
          <PhoneInput
            value={form.phone}
            onChange={(p) => setForm({ ...form, phone: p })}
            error={fieldError("phone")}
          />
        </div>

        {/* Organization */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="org-name-field" className="text-sm font-semibold text-text font-body">Organization name</label>
          <input
            id="org-name-field"
            type="text"
            value={form.org}
            onChange={(e) => setForm({ ...form, org: e.target.value })}
            placeholder="e.g. Grace Arena"
            aria-label="Organization name"
            aria-invalid={!!fieldError("org")}
            className={cn(
              "w-full h-11 px-3.5 rounded-sm border bg-white text-text text-[15px] font-body transition-colors",
              "placeholder:text-text-muted focus:outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20",
              fieldError("org") ? "border-status-danger" : "border-border",
            )}
          />
          {fieldError("org") && <p role="alert" className="text-xs text-status-danger font-semibold">{fieldError("org")}</p>}
        </div>

        {/* Role (locked) */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-text font-body">Role</label>
          <div className="flex items-center h-11 px-3.5 gap-2 border border-border rounded-sm bg-surface-bg">
            <Icon name="Lock" size={16} className="text-text-muted shrink-0" />
            <span className="text-text-secondary text-[15px] font-body">Organizer</span>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function OrganizerDetailPanel({ org, onBack }: { org: OrganizerType; onBack: () => void }) {
  const [tab, setTab] = useState<"events" | "agents" | "activity">("events");
  const [status, setStatus] = useState(org.status);
  const [confirmSuspend, setConfirmSuspend] = useState(false);

  const events = ORG_EVENTS.slice(0, 3) as OrgEventRow[];
  const agents = GATE_AGENTS.slice(0, 3);

  const handleToggle = () => {
    if (status === "Active") setConfirmSuspend(true);
    else setStatus("Active");
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-sm text-text-secondary mb-1.5">
            <button type="button" onClick={onBack} className="hover:text-text transition-colors focus-visible:outline-none">
              Organizers
            </button>
            <Icon name="ChevronRight" size={14} className="text-text-muted" />
            <span className="text-text font-medium">{org.name}</span>
          </div>
          <h1 className="font-display font-bold text-[26px] text-text flex items-center gap-3 flex-wrap m-0">
            {org.name}
            <StatusPill status={status as import("@/components/Shared/StatusPill").StatusValue} />
          </h1>
        </div>
        <Button
          variant={status === "Active" ? "ghost" : "primary"}
          className="gap-2 shrink-0"
          onClick={handleToggle}
        >
          <Icon name={status === "Active" ? "Ban" : "Check"} size={15} />
          {status === "Active" ? "Suspend" : "Activate"}
        </Button>
      </div>

      {status === "Suspended" && (
        <AlertBanner
          tone="warning"
          title="This organizer is suspended"
          message="They cannot create or manage events until reactivated."
        />
      )}

      {/* Info card */}
      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-display font-semibold text-[17px] text-text m-0">Organizer information</h2>
        </div>
        <div className="p-6 grid grid-cols-2 gap-x-8 gap-y-4">
          {[
            { label: "Contact",           value: org.contact },
            { label: "Phone",             value: org.phone, mono: true },
            { label: "Organization",      value: org.org },
            { label: "Joined",            value: org.joined },
            { label: "Total events",      value: String(org.events) },
            { label: "Revenue generated", value: formatSSP(org.revenue) },
          ].map(({ label, value, mono }) => (
            <div key={label}>
              <div className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1">{label}</div>
              <div className={cn("font-semibold text-text", mono && "font-mono")}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border" role="tablist">
        {[["events", "Events"], ["agents", "Gate agents"], ["activity", "Activity log"]].map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id as typeof tab)}
            className={cn(
              "px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange",
              tab === id ? "border-brand-orange text-brand-orange" : "border-transparent text-text-secondary hover:text-text",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Events tab */}
      {tab === "events" && (
        <div className="bg-surface border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" aria-label="Organizer events">
              <thead>
                <tr className="border-b border-border bg-surface-bg">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Event</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Venue</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Tickets sold</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => (
                  <tr key={e.id} className="border-b border-border/50 last:border-b-0 hover:bg-surface-bg/50">
                    <td className="px-5 py-3.5 font-semibold">{e.name}</td>
                    <td className="px-4 py-3.5">{e.date}</td>
                    <td className="px-4 py-3.5 text-text-muted max-w-[180px] truncate">{e.venue}</td>
                    <td className="px-4 py-3.5 font-mono text-[13px]">
                      {e.status === "Draft" ? "—" : `${e.sold.toLocaleString()} / ${e.capacity.toLocaleString()}`}
                    </td>
                    <td className="px-4 py-3.5"><StatusPill status={e.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Gate agents tab */}
      {tab === "agents" && (
        <div className="bg-surface border border-border rounded-lg overflow-hidden">
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
                    <td className="px-4 py-3.5"><StatusPill status={a.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Activity log tab */}
      {tab === "activity" && (
        <div className="bg-surface border border-border rounded-lg overflow-hidden">
          <div className="divide-y divide-border">
            {ORG_ACTIVITY.map((a, i) => (
              <div key={i} className="flex items-start gap-4 px-6 py-4">
                <div className="w-2 h-2 rounded-full bg-brand-orange mt-1.5 shrink-0" />
                <div>
                  <div className="font-medium text-[14px] text-text">{a.action}</div>
                  <div className="font-mono text-xs text-text-secondary mt-0.5">{a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suspend confirm modal */}
      {confirmSuspend && (
        <Modal
          open
          title={`Suspend ${org.name}?`}
          description="They will be unable to create or manage events until reactivated."
          onClose={() => setConfirmSuspend(false)}
          footer={
            <>
              <Button variant="ghost" onClick={() => setConfirmSuspend(false)}>Cancel</Button>
              <Button variant="danger" className="gap-2" onClick={() => { setStatus("Suspended"); setConfirmSuspend(false); }}>
                <Icon name="Ban" size={15} />
                Suspend
              </Button>
            </>
          }
        >
          <p className="text-sm text-text-secondary">Active events stay live, but no new changes can be made.</p>
        </Modal>
      )}
    </div>
  );
}

export default function AdminOrganizersPage() {
  const [state, setState] = useState<PageState>("loaded");
  const [addModal, setAddModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{ type: "suspend" | "delete"; org: OrganizerType } | null>(null);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<OrganizerType | null>(null);

  const existingPhones = ORGANIZERS.map((o) => o.phone.replace(/\s/g, ""));
  const rows = state === "empty" ? [] : ORGANIZERS.filter(
    (o) => o.name.toLowerCase().includes(q.toLowerCase()) || o.contact.toLowerCase().includes(q.toLowerCase()),
  );

  if (selected) {
    return (
      <div className="px-6 pt-5 pb-10">
        <OrganizerDetailPanel org={selected} onBack={() => setSelected(null)} />
      </div>
    );
  }

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
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display font-bold text-[26px] text-text mb-0.5">Organizers</h1>
            <p className="text-sm text-text-secondary">Everyone authorised to create events on Tiketi.</p>
          </div>
          <Button className="gap-2 shrink-0" onClick={() => setAddModal(true)} aria-label="Add organizer">
            <Icon name="UserPlus" size={16} />
            Add organizer
          </Button>
        </div>

        {/* Search */}
        {state !== "empty" && state !== "loading" && (
          <div className="flex items-center gap-2 h-10 px-3.5 border border-border rounded-sm bg-white max-w-[360px] focus-within:border-brand-orange focus-within:ring-2 focus-within:ring-brand-orange/20 transition-colors">
            <Icon name="Search" size={16} className="text-text-muted shrink-0" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search organizers..."
              aria-label="Search organizers"
              className="flex-1 bg-transparent text-sm text-text placeholder:text-text-muted focus:outline-none"
            />
          </div>
        )}

        {/* Empty state */}
        {(state === "empty" || (state === "loaded" && rows.length === 0 && q)) && (
          <div className="bg-surface border border-border rounded-lg p-6">
            <EmptyState
              icon="Building2"
              heading={state === "empty" ? "No organizers yet" : "No organizers match your search"}
              subtext={state === "empty" ? "Invite an organizer to start hosting events." : "Try a different search term."}
              cta={state === "empty" ? <Button size="sm" onClick={() => setAddModal(true)}>Add organizer</Button> : undefined}
            />
          </div>
        )}

        {/* Table */}
        {state !== "empty" && !(state === "loaded" && rows.length === 0 && q) && (
          <div className="bg-surface border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm" aria-label="Organizers table">
                <thead>
                  <tr className="border-b border-border bg-surface-bg">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Name</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Phone</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Events</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Joined</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {state === "loading"
                    ? Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i} className="border-b border-border/50">
                          <td className="px-5 py-4"><div className="h-4 w-32 skeleton rounded" /></td>
                          <td className="px-4 py-4"><div className="h-3 w-28 skeleton rounded" /></td>
                          <td className="px-4 py-4"><div className="h-3 w-8 skeleton rounded" /></td>
                          <td className="px-4 py-4"><div className="h-5 w-16 skeleton rounded-pill" /></td>
                          <td className="px-4 py-4"><div className="h-3 w-20 skeleton rounded" /></td>
                          <td className="px-5 py-4 text-right"><div className="h-7 w-24 skeleton rounded ml-auto" /></td>
                        </tr>
                      ))
                    : rows.map((o) => (
                        <tr key={o.id} className="border-b border-border/50 last:border-b-0 hover:bg-surface-bg/50">
                          <td className="px-5 py-4">
                            <button
                              type="button"
                              onClick={() => setSelected(o)}
                              className="font-semibold text-text hover:text-brand-orange transition-colors focus-visible:outline-none"
                            >
                              {o.name}
                            </button>
                            <div className="text-xs text-text-muted mt-0.5">{o.contact}</div>
                          </td>
                          <td className="px-4 py-4 font-mono text-[13px]">{o.phone}</td>
                          <td className="px-4 py-4 font-mono text-[13px]">{o.events}</td>
                          <td className="px-4 py-4"><StatusPill status={o.status as import("@/components/Shared/StatusPill").StatusValue} /></td>
                          <td className="px-4 py-4 text-text-muted">{o.joined}</td>
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                aria-label={`View ${o.name}`}
                                onClick={() => setSelected(o)}
                                className="w-8 h-8 rounded border border-border text-text-secondary inline-flex items-center justify-center hover:border-brand-orange/40 hover:text-brand-orange transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
                              >
                                <Icon name="Eye" size={15} />
                              </button>
                              <button
                                type="button"
                                aria-label={`Suspend ${o.name}`}
                                onClick={() => setConfirmModal({ type: "suspend", org: o })}
                                className="w-8 h-8 rounded border border-border text-text-secondary inline-flex items-center justify-center hover:border-status-warning/40 hover:text-status-warning transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-warning"
                              >
                                <Icon name="Ban" size={15} />
                              </button>
                              <button
                                type="button"
                                aria-label={`Delete ${o.name}`}
                                onClick={() => setConfirmModal({ type: "delete", org: o })}
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

      {/* Add organizer modal */}
      {addModal && (
        <AddOrganizerModal onClose={() => setAddModal(false)} existingPhones={existingPhones} />
      )}

      {/* Suspend confirm modal */}
      {confirmModal?.type === "suspend" && (
        <Modal
          open
          title={`Suspend ${confirmModal.org.name}?`}
          description="They will be unable to create or manage events until reactivated."
          onClose={() => setConfirmModal(null)}
          footer={
            <>
              <Button variant="ghost" onClick={() => setConfirmModal(null)}>Cancel</Button>
              <Button variant="danger" className="gap-2" onClick={() => setConfirmModal(null)}>
                <Icon name="Ban" size={15} />
                Suspend
              </Button>
            </>
          }
        >
          <p className="text-sm text-text-secondary">Active events stay live, but no new changes can be made.</p>
        </Modal>
      )}

      {/* Delete confirm modal */}
      {confirmModal?.type === "delete" && (
        <Modal
          open
          title={`Delete ${confirmModal.org.name}?`}
          description="This permanently removes the organizer and all their draft events. This cannot be undone."
          onClose={() => setConfirmModal(null)}
          footer={
            <>
              <Button variant="ghost" onClick={() => setConfirmModal(null)}>Cancel</Button>
              <Button variant="danger" className="gap-2" onClick={() => setConfirmModal(null)}>
                <Icon name="Trash2" size={15} />
                Delete organizer
              </Button>
            </>
          }
        >
          <div className="flex flex-col gap-1.5 py-2">
            <label htmlFor="delete-confirm" className="text-sm font-semibold text-text font-body">
              Type <span className="font-mono text-status-danger">DELETE</span> to confirm
            </label>
            <input
              id="delete-confirm"
              type="text"
              placeholder="DELETE"
              aria-label="Type DELETE to confirm"
              className="w-full h-11 px-3.5 rounded-sm border border-border bg-white text-text text-[15px] font-body focus:outline-none focus:border-status-danger focus:ring-2 focus:ring-status-danger/20"
            />
          </div>
        </Modal>
      )}
    </div>
  );
}
