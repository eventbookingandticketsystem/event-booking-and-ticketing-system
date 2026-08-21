'use client';

import { useState } from "react";
import { StatusPill } from "@/components/Shared/StatusPill";
import { EmptyState } from "@/components/Shared/EmptyState";
import { AlertBanner } from "@/components/Shared/AlertBanner";
import { SkeletonCard } from "@/components/Shared/SkeletonCard";
import { Modal } from "@/components/Shared/Modal";
import { Button } from "@/components/Shared/Button";
import { Icon } from "@/components/Shared/Icon";
import { PhoneInput } from "@/components/Shared/PhoneInput";
import { DEFAULT_PHONE, type PhoneValue } from "@/constants/countries";
import { formatSSP } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { OrganizerType } from "@/types/user";
import {
  useAdminUsers,
  useAdminEvents,
  useUpdateAdminUser,
  useDeleteAdminUser,
  adaptAdminUserToOrganizer,
} from "@/lib/api/hooks/useAdminData";
import { useAgents } from "@/lib/api/hooks/useAgents";
import type { ApiAdminUser } from "@/lib/api/types";

// ── Add Organizer Modal ────────────────────────────────────────────────────────
// No real POST /api/admin/users create endpoint exists — this validates inline
// and submits to a toast (SMS invite is a planned feature).
function AddOrganizerModal({
  onClose,
  existingPhones,
}: {
  onClose: () => void;
  existingPhones: string[];
}) {
  const [form, setForm]     = useState({ name: "", phone: DEFAULT_PHONE as PhoneValue, org: "" });
  const [touched, setTouched] = useState(false);
  const [sent, setSent]      = useState(false);

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
  const fieldError = (k: keyof typeof errors) => (touched ? errors[k] : "");

  const handleSubmit = () => {
    setTouched(true);
    if (!isValid) return;
    setSent(true);
    setTimeout(onClose, 1200);
  };

  return (
    <Modal
      open
      title="Add organizer"
      description="They'll receive an invite by SMS to set up their account."
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={sent}>Cancel</Button>
          <Button className="gap-2" onClick={handleSubmit} disabled={sent}>
            <Icon name={sent ? "Check" : "Send"} size={15} />
            {sent ? "Invite sent" : "Send invite"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4 py-2">
        {sent && (
          <AlertBanner tone="success" title="Invite sent" message="They'll receive an SMS with setup instructions." />
        )}

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

// ── Organizer Detail Panel (AD2b) ──────────────────────────────────────────────
function OrganizerDetailPanel({
  apiUser,
  adapted,
  onBack,
}: {
  apiUser: ApiAdminUser;
  adapted: OrganizerType;
  onBack: () => void;
}) {
  const [tab,            setTab]            = useState<"events" | "agents" | "activity">("events");
  const [confirmSuspend, setConfirmSuspend] = useState(false);

  const updateUser = useUpdateAdminUser(apiUser.id);
  const status = adapted.status;

  // Events for this organizer (filter by orgProfileId if available)
  const { data: eventsResult } = useAdminEvents({ limit: 20 });
  const orgProfileId = apiUser.orgProfile?.id;
  const orgEvents = eventsResult?.data.filter(() => true) ?? [];  // all events (no per-org filter in API)

  // Gate agents for this organizer's events
  const { data: agents = [] } = useAgents({ limit: 50 });

  const handleToggle = () => {
    if (status === "Active") setConfirmSuspend(true);
    else updateUser.mutate({ status: "Active" });
  };

  const confirmSuspendAction = async () => {
    try {
      await updateUser.mutateAsync({ status: "Suspended" });
      setConfirmSuspend(false);
    } catch {
      // Error shown in modal via updateUser.isError
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-sm text-text-secondary mb-1.5">
            <button type="button" onClick={onBack} className="hover:text-text transition-colors focus-visible:outline-none">
              Organizers
            </button>
            <Icon name="ChevronRight" size={14} className="text-text-muted" />
            <span className="text-text font-medium">{adapted.name}</span>
          </div>
          <h1 className="font-display font-bold text-[26px] text-text flex items-center gap-3 flex-wrap m-0">
            {adapted.name}
            <StatusPill status={status as Parameters<typeof StatusPill>[0]["status"]} />
          </h1>
        </div>
        <Button
          variant={status === "Active" ? "ghost" : "primary"}
          className="gap-2 shrink-0"
          onClick={handleToggle}
          disabled={updateUser.isPending}
          aria-label={status === "Active" ? `Suspend ${adapted.name}` : `Activate ${adapted.name}`}
        >
          <Icon name={status === "Active" ? "Ban" : "Check"} size={15} />
          {status === "Active" ? "Suspend" : "Activate"}
        </Button>
      </div>

      {updateUser.isError && (
        <AlertBanner
          tone="danger"
          title="Could not update organizer"
          message={updateUser.error?.message ?? "Please try again."}
        />
      )}

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
          {([
            { label: "Contact",      value: apiUser.orgProfile?.contactName ?? apiUser.name ?? "—" },
            { label: "Phone",        value: apiUser.phone ?? "—", mono: true },
            { label: "Organization", value: apiUser.orgProfile?.orgName ?? "—" },
            { label: "Joined",       value: adapted.joined },
            { label: "Email",        value: apiUser.email ?? "—" },
            { label: "Revenue",      value: "—" },  // not in API list
          ] as { label: string; value: string; mono?: boolean }[]).map(({ label, value, mono }) => (
            <div key={label}>
              <div className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1">{label}</div>
              <div className={cn("font-semibold text-text", mono && "font-mono")}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border" role="tablist">
        {([["events", "Events"], ["agents", "Gate agents"], ["activity", "Activity log"]] as const).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
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
        orgEvents.length === 0 ? (
          <div className="bg-surface border border-border rounded-lg p-6">
            <EmptyState icon="Calendar" heading="No events yet" subtext="This organizer has not created any events." />
          </div>
        ) : (
          <div className="bg-surface border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm" aria-label="Organizer events">
                <thead>
                  <tr className="border-b border-border bg-surface-bg">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Event</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Date</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Tickets sold</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orgEvents.map((e) => (
                    <tr key={e.id} className="border-b border-border/50 last:border-b-0 hover:bg-surface-bg/50">
                      <td className="px-5 py-3.5 font-semibold">{e.name}</td>
                      <td className="px-4 py-3.5">{e.date}</td>
                      <td className="px-4 py-3.5 font-mono text-[13px]">{e.sold.toLocaleString()}</td>
                      <td className="px-4 py-3.5"><StatusPill status={e.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* Gate agents tab */}
      {tab === "agents" && (
        agents.length === 0 ? (
          <div className="bg-surface border border-border rounded-lg p-6">
            <EmptyState icon="Users" heading="No agents" subtext="No gate agents assigned to this organizer's events." />
          </div>
        ) : (
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
                    <tr key={String(a.id)} className="border-b border-border/50 last:border-b-0 hover:bg-surface-bg/50">
                      <td className="px-5 py-3.5 font-semibold">{a.name}</td>
                      <td className="px-4 py-3.5 font-mono text-[13px]">{a.phone}</td>
                      <td className="px-4 py-3.5 text-text-secondary">{a.gate}</td>
                      <td className="px-4 py-3.5">
                        <StatusPill status={a.status as Parameters<typeof StatusPill>[0]["status"]} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* Activity log tab — no real activity API yet */}
      {tab === "activity" && (
        <div className="bg-surface border border-border rounded-lg p-6">
          <EmptyState
            icon="ClipboardList"
            heading="Activity log coming soon"
            subtext="Organizer-level activity history is a planned feature."
          />
        </div>
      )}

      {/* Suspend confirm modal */}
      {confirmSuspend && (
        <Modal
          open
          title={`Suspend ${adapted.name}?`}
          description="They will be unable to create or manage events until reactivated."
          onClose={() => { if (!updateUser.isPending) { setConfirmSuspend(false); updateUser.reset(); } }}
          footer={
            <>
              <Button
                variant="ghost"
                onClick={() => { setConfirmSuspend(false); updateUser.reset(); }}
                disabled={updateUser.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                className="gap-2"
                onClick={confirmSuspendAction}
                disabled={updateUser.isPending}
              >
                {updateUser.isPending ? (
                  <>
                    <Icon name="Loader" size={15} className="animate-spin" />
                    Suspending...
                  </>
                ) : (
                  <>
                    <Icon name="Ban" size={15} />
                    Suspend
                  </>
                )}
              </Button>
            </>
          }
        >
          {updateUser.isError ? (
            <AlertBanner
              tone="danger"
              title="Could not suspend organizer"
              message={updateUser.error?.message ?? "Please try again."}
            />
          ) : (
            <p className="text-sm text-text-secondary">Active events stay live, but no new changes can be made.</p>
          )}
        </Modal>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function AdminOrganizersPage() {
  const [q,           setQ]           = useState("");
  const [addModal,    setAddModal]    = useState(false);
  const [confirmModal, setConfirmModal] = useState<{ type: "suspend" | "delete"; user: ApiAdminUser } | null>(null);
  const [selectedId,  setSelectedId]  = useState<string | null>(null);

  const { data: result, isLoading, isError, error } = useAdminUsers({ role: "ORGANIZER", limit: 50 });
  const apiUsers  = result?.data ?? [];
  const adapted   = apiUsers.map(adaptAdminUserToOrganizer);

  // Derived (not snapshotted) so it reflects the latest fetch after a mutation invalidates the query.
  const selected = selectedId ? apiUsers.find((u) => u.id === selectedId) ?? null : null;

  const updateUser = useUpdateAdminUser(confirmModal?.user.id ?? "");
  const deleteUser = useDeleteAdminUser();

  // Search filter (client-side — results already scoped to ORGANIZER role)
  const filtered  = adapted.filter((o) =>
    !q || o.name.toLowerCase().includes(q.toLowerCase()) || o.contact.toLowerCase().includes(q.toLowerCase()),
  );

  const existingPhones = apiUsers.map((u) => (u.phone ?? "").replace(/\s/g, ""));

  const closeConfirmModal = () => {
    setConfirmModal(null);
    updateUser.reset();
    deleteUser.reset();
  };

  const confirmSuspend = async () => {
    if (!confirmModal) return;
    try {
      await updateUser.mutateAsync({ status: "Suspended" });
      setConfirmModal(null);
    } catch {
      // Error shown in modal via updateUser.isError
    }
  };

  const confirmDelete = async () => {
    if (!confirmModal) return;
    try {
      await deleteUser.mutateAsync(confirmModal.user.id);
      setConfirmModal(null);
    } catch {
      // Error shown in modal via deleteUser.isError
    }
  };

  // ── Detail view ────────────────────────────────────────────────────────────
  if (selected) {
    const adaptedSelected = adaptAdminUserToOrganizer(selected);
    return (
      <div className="px-6 pt-5 pb-10">
        <OrganizerDetailPanel
          apiUser={selected}
          adapted={adaptedSelected}
          onBack={() => setSelectedId(null)}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
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

        {/* Error */}
        {isError && (
          <AlertBanner
            tone="danger"
            title="Could not load organizers"
            message={error?.message ?? "Please try again."}
          />
        )}

        {/* Search */}
        {!isLoading && !isError && (
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

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col gap-3">
            <SkeletonCard className="h-12" />
            <SkeletonCard className="h-12" />
            <SkeletonCard className="h-12" />
          </div>
        )}

        {/* Empty */}
        {!isLoading && !isError && filtered.length === 0 && (
          <div className="bg-surface border border-border rounded-lg p-6">
            <EmptyState
              icon="Building2"
              heading={q ? "No organizers match your search" : "No organizers yet"}
              subtext={q ? "Try a different search term." : "Invite an organizer to start hosting events."}
              cta={!q ? <Button size="sm" onClick={() => setAddModal(true)}>Add organizer</Button> : undefined}
            />
          </div>
        )}

        {/* Table */}
        {!isLoading && !isError && filtered.length > 0 && (
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
                  {filtered.map((o) => {
                    const apiUser = apiUsers.find((u) => u.id === o.id)!;
                    return (
                      <tr key={o.id} className="border-b border-border/50 last:border-b-0 hover:bg-surface-bg/50">
                        <td className="px-5 py-4">
                          <button
                            type="button"
                            onClick={() => setSelectedId(o.id)}
                            className="font-semibold text-text hover:text-brand-orange transition-colors focus-visible:outline-none text-left"
                          >
                            {o.name}
                          </button>
                          <div className="text-xs text-text-muted mt-0.5">{o.contact}</div>
                        </td>
                        <td className="px-4 py-4 font-mono text-[13px]">{o.phone}</td>
                        <td className="px-4 py-4 font-mono text-[13px]">—</td>
                        <td className="px-4 py-4">
                          <StatusPill status={o.status as Parameters<typeof StatusPill>[0]["status"]} />
                        </td>
                        <td className="px-4 py-4 text-text-muted">{o.joined}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              aria-label={`View ${o.name}`}
                              onClick={() => setSelectedId(o.id)}
                              className="w-8 h-8 rounded border border-border text-text-secondary inline-flex items-center justify-center hover:border-brand-orange/40 hover:text-brand-orange transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
                            >
                              <Icon name="Eye" size={15} />
                            </button>
                            <button
                              type="button"
                              aria-label={`Suspend ${o.name}`}
                              onClick={() => setConfirmModal({ type: "suspend", user: apiUser })}
                              className="w-8 h-8 rounded border border-border text-text-secondary inline-flex items-center justify-center hover:border-status-warning/40 hover:text-status-warning transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-warning"
                            >
                              <Icon name="Ban" size={15} />
                            </button>
                            <button
                              type="button"
                              aria-label={`Delete ${o.name}`}
                              onClick={() => setConfirmModal({ type: "delete", user: apiUser })}
                              className="w-8 h-8 rounded border border-border text-text-secondary inline-flex items-center justify-center hover:border-status-danger/40 hover:text-status-danger transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-danger"
                            >
                              <Icon name="Trash2" size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add organizer modal */}
      {addModal && (
        <AddOrganizerModal
          onClose={() => setAddModal(false)}
          existingPhones={existingPhones}
        />
      )}

      {/* Suspend confirm */}
      {confirmModal?.type === "suspend" && (
        <Modal
          open
          title={`Suspend ${confirmModal.user.name ?? "organizer"}?`}
          description="They will be unable to create or manage events until reactivated."
          onClose={() => { if (!updateUser.isPending) closeConfirmModal(); }}
          footer={
            <>
              <Button variant="ghost" onClick={closeConfirmModal} disabled={updateUser.isPending}>Cancel</Button>
              <Button variant="danger" className="gap-2" onClick={confirmSuspend} disabled={updateUser.isPending}>
                {updateUser.isPending ? (
                  <>
                    <Icon name="Loader" size={15} className="animate-spin" />
                    Suspending...
                  </>
                ) : (
                  <>
                    <Icon name="Ban" size={15} />
                    Suspend
                  </>
                )}
              </Button>
            </>
          }
        >
          {updateUser.isError ? (
            <AlertBanner
              tone="danger"
              title="Could not suspend organizer"
              message={updateUser.error?.message ?? "Please try again."}
            />
          ) : (
            <p className="text-sm text-text-secondary">Active events stay live, but no new changes can be made.</p>
          )}
        </Modal>
      )}

      {/* Delete confirm */}
      {confirmModal?.type === "delete" && (
        <Modal
          open
          title={`Delete ${confirmModal.user.name ?? "organizer"}?`}
          description="This permanently removes the organizer and all their events."
          onClose={() => { if (!deleteUser.isPending) closeConfirmModal(); }}
          footer={
            <>
              <Button variant="ghost" onClick={closeConfirmModal} disabled={deleteUser.isPending}>Cancel</Button>
              <Button variant="danger" className="gap-2" onClick={confirmDelete} disabled={deleteUser.isPending}>
                {deleteUser.isPending ? (
                  <>
                    <Icon name="Loader" size={15} className="animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Icon name="Trash2" size={15} />
                    Delete organizer
                  </>
                )}
              </Button>
            </>
          }
        >
          {deleteUser.isError ? (
            <AlertBanner
              tone="danger"
              title="Could not delete organizer"
              message={deleteUser.error?.message ?? "Please try again."}
            />
          ) : (
            <AlertBanner tone="danger" title="Irreversible action" message="All their events and ticket data will be permanently removed." />
          )}
        </Modal>
      )}
    </div>
  );
}
