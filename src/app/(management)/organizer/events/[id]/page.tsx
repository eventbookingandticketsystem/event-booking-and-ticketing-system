'use client';

import { useState, use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CldUploadWidget } from "next-cloudinary";
import { OrgTopbar } from "@/components/Organizer/OrgTopbar";
import { StatCard } from "@/components/Shared/StatCard";
import { LineChart } from "@/components/Shared/LineChart";
import { HBarChart } from "@/components/Shared/HBarChart";
import { StatusPill } from "@/components/Shared/StatusPill";
import { EmptyState } from "@/components/Shared/EmptyState";
import { AlertBanner } from "@/components/Shared/AlertBanner";
import { SkeletonCard } from "@/components/Shared/SkeletonCard";
import { Modal } from "@/components/Shared/Modal";
import { Button } from "@/components/Shared/Button";
import { Icon } from "@/components/Shared/Icon";
import { formatSSP, cn } from "@/lib/utils";
import { useOrgEventDetail } from "@/lib/api/hooks/useOrgEventDetail";
import { useOrgDashboard } from "@/lib/api/hooks/useOrgDashboard";
import { useAgents } from "@/lib/api/hooks/useAgents";
import { useUpdateEvent, useDeleteEvent } from "@/lib/api/hooks/useUpdateEvent";

interface PageProps {
  params: Promise<{ id: string }>;
}

const TABS = [
  { id: "overview",   label: "Overview" },
  { id: "categories", label: "Ticket categories" },
  { id: "agents",     label: "Gate agents" },
  { id: "reports",    label: "Reports" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const CATEGORIES = [
  "Concert", "Football", "Conference", "Graduation",
  "Church", "Food & Drinks", "Arts & Culture", "Other",
] as const;

const EVENT_STATUSES = [
  { value: "DRAFT",     label: "Draft" },
  { value: "PUBLISHED", label: "Published" },
  { value: "ONGOING",   label: "Ongoing" },
  { value: "COMPLETED", label: "Completed" },
] as const;

const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? "tiketi_events";

interface CloudinaryResult {
  public_id: string;
  secure_url: string;
}

function isFutureDate(d: string): boolean {
  if (!d) return true; // allow empty during editing
  return new Date(d) > new Date();
}

function progressColor(pct: number): string {
  if (pct >= 90) return "bg-status-danger";
  if (pct >= 60) return "bg-brand-orange";
  return "bg-status-success";
}

// ── Edit form state interface ─────────────────────────────────────────────────
interface EditFields {
  title:       string;
  description: string;
  venue:       string;
  city:        string;
  date:        string;   // "YYYY-MM-DD"
  time:        string;   // "18:00"
  category:    string;
  status:      string;
  imageUrl:    string;   // Cloudinary URL (empty = no change)
}

export default function OrgEventDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router  = useRouter();
  const [tab, setTab] = useState<TabId>("overview");

  // ── Modal state ───────────────────────────────────────────────────────────
  const [editOpen,   setEditOpen]   = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [uploading,  setUploading]  = useState(false);
  const [touched,    setTouched]    = useState(false);

  const [edit, setEdit] = useState<EditFields>({
    title: "", description: "", venue: "", city: "",
    date: "", time: "", category: "", status: "", imageUrl: "",
  });
  const setField = (k: keyof EditFields) => (v: string) =>
    setEdit((prev) => ({ ...prev, [k]: v }));

  // ── Data hooks ────────────────────────────────────────────────────────────
  const {
    data: ev,
    isLoading: evLoading,
    isError:   evError,
    error:     evErrorObj,
  } = useOrgEventDetail(id);

  const { data: dash } = useOrgDashboard(tab === "overview" ? id : null);
  const { data: agents = [], isLoading: agentsLoading } = useAgents({ eventId: id });

  const updateEvent = useUpdateEvent(id);
  const deleteEvent = useDeleteEvent(id);

  // Pre-fill edit form when event data arrives (only before modal opens)
  useEffect(() => {
    if (ev && !editOpen) {
      // Convert formatted date back to YYYY-MM-DD for the date input
      // ev.date is "Sat, 14 Dec 2026" — we need to derive the raw date.
      // We store the raw date separately via `rawDate` in the detail adapter.
      // For now, default to empty so the user must re-enter if changing date.
      setEdit({
        title:       ev.name,
        description: ev.description ?? "",
        venue:       ev.venue,
        city:        ev.city ?? "",
        date:        ev.rawDate ?? "",   // raw YYYY-MM-DD if adapter exposes it
        time:        ev.time ?? "",
        category:    ev.category,
        status:      (() => {
          // Map display status back to API status value
          switch (ev.status) {
            case "Draft":     return "DRAFT";
            case "Upcoming":
            case "Published": return "PUBLISHED";
            case "Ongoing":   return "ONGOING";
            case "Completed": return "COMPLETED";
            default:          return "PUBLISHED";
          }
        })(),
        imageUrl:    ev.image ?? "",
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ev?.name, ev?.venue, editOpen]);

  // ── Validation ────────────────────────────────────────────────────────────
  const titleErr    = touched && !edit.title.trim()    ? "Title is required"    : "";
  const venueErr    = touched && !edit.venue.trim()    ? "Venue is required"    : "";
  const categoryErr = touched && !edit.category        ? "Category is required" : "";
  const dateErr     = touched && edit.date && !isFutureDate(edit.date)
    ? "Date must be in the future" : "";

  const hasErrors = !!(titleErr || venueErr || categoryErr || dateErr);

  const handleSaveEdit = async () => {
    setTouched(true);
    if (hasErrors || !edit.title.trim() || !edit.venue.trim() || !edit.category) return;

    try {
      const payload: Parameters<typeof updateEvent.mutateAsync>[0] = {
        title:    edit.title.trim(),
        venue:    edit.venue.trim(),
        city:     edit.city.trim() || undefined,
        category: edit.category,
        status:   edit.status as "DRAFT" | "PUBLISHED" | "ONGOING" | "COMPLETED" | "CANCELLED",
      };
      if (edit.description.trim()) payload.description = edit.description.trim();
      if (edit.time.trim())        payload.time        = edit.time.trim();
      if (edit.imageUrl)           payload.image       = edit.imageUrl;
      if (edit.date) {
        // Combine date + time into ISO datetime
        const timeStr = edit.time || "00:00";
        payload.date = new Date(`${edit.date}T${timeStr}`).toISOString();
      }

      await updateEvent.mutateAsync(payload);
      setEditOpen(false);
    } catch {
      // Error shown in modal
    }
  };

  const handleCloseEdit = () => {
    if (updateEvent.isPending) return;
    setEditOpen(false);
    setTouched(false);
    updateEvent.reset();
  };

  const handleCancelEvent = async () => {
    try {
      await deleteEvent.mutateAsync();
      router.push("/organizer/events");
    } catch {
      // Error shown in modal
    }
  };

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (evLoading) {
    return (
      <div className="flex flex-col min-h-full">
        <OrgTopbar crumb="Event" />
        <div className="px-6 pt-5 pb-10 flex flex-col gap-5">
          <div className="h-8 w-72 skeleton rounded" />
          <div className="flex gap-1 border-b border-border pb-0">
            {TABS.map((t) => (
              <div key={t.id} className="h-9 w-24 skeleton rounded mx-1" />
            ))}
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[0,1,2,3].map((i) => (
              <div key={i} className="bg-surface border border-border rounded-lg p-5">
                <div className="h-3 w-24 skeleton rounded mb-3" />
                <div className="h-8 w-32 skeleton rounded" />
              </div>
            ))}
          </div>
          <SkeletonCard className="h-48" />
        </div>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (evError || !ev) {
    return (
      <div className="flex flex-col min-h-full">
        <OrgTopbar crumb="Event" />
        <div className="px-6 pt-5">
          <AlertBanner
            tone="danger"
            title="Event not found"
            message={evErrorObj?.message ?? "This event could not be loaded."}
          />
          <Button
            variant="ghost"
            onClick={() => router.push("/organizer/events")}
            className="mt-4 gap-2"
          >
            <Icon name="ArrowLeft" size={16} />
            Back to events
          </Button>
        </div>
      </div>
    );
  }

  // Dashboard stats derived from dashboard hook
  const revenue = dash?.revenue
    ?? ev.tiers.reduce((s, t) => s + (t.capacity - t.remaining) * t.price, 0);

  const lineData = dash
    ? dash.entryRate.map((pt) => ({ label: pt.t, value: pt.v }))
    : [];
  const barData = dash
    ? dash.tiers.map((t) => ({ label: t.name, value: t.count, color: t.color }))
    : [];

  return (
    <div className="flex flex-col min-h-full">
      <OrgTopbar crumb={ev.name} />

      <div className="px-6 pt-5 pb-10 flex flex-col gap-5">
        {/* Page header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-sm text-text-secondary mb-1.5">
              <button
                type="button"
                onClick={() => router.push("/organizer/events")}
                className="hover:text-text transition-colors focus-visible:outline-none"
              >
                My events
              </button>
              <Icon name="ChevronRight" size={14} className="text-text-muted" />
              <span className="text-text font-medium">{ev.name}</span>
            </div>
            <h1 className="font-display font-bold text-[26px] text-text flex items-center gap-3 flex-wrap m-0">
              {ev.name}
              <StatusPill status={ev.status as Parameters<typeof StatusPill>[0]["status"]} />
            </h1>
          </div>
          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="ghost"
              className="gap-2"
              onClick={() => setEditOpen(true)}
              aria-label="Edit event"
            >
              <Icon name="Pencil" size={15} />
              Edit event
            </Button>
            <button
              type="button"
              onClick={() => setCancelOpen(true)}
              aria-label="Cancel event"
              title="Cancel event"
              className="w-9 h-9 rounded border border-border text-text-secondary inline-flex items-center justify-center hover:border-status-danger/40 hover:text-status-danger transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-danger"
            >
              <Icon name="Trash2" size={15} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange",
                tab === t.id
                  ? "border-brand-orange text-brand-orange"
                  : "border-transparent text-text-secondary hover:text-text",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ── */}
        {tab === "overview" && (
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Tickets Sold"
                value={(dash?.sold ?? ev.sold).toLocaleString()}
                chipIcon={<Icon name="Ticket" size={17} />}
                chipBg="bg-status-info-bg"
                chipFg="text-brand-navy"
                footText={`of ${ev.capacity.toLocaleString()} capacity`}
              />
              <StatCard
                label="Revenue"
                value={formatSSP(revenue)}
                chipIcon={<Icon name="TrendingUp" size={17} />}
                chipBg="bg-status-success-bg"
                chipFg="text-status-success"
                footDot="bg-status-success"
                footText="Gross sales"
              />
              <StatCard
                label="Categories"
                value={String(ev.tiers.length)}
                chipIcon={<Icon name="Layers" size={17} />}
                footText="Ticket tiers"
              />
              <StatCard
                label="Gate Agents"
                value={String(ev.agentCount)}
                chipIcon={<Icon name="Users" size={17} />}
                chipBg="bg-status-warning-bg"
                chipFg="text-status-warning"
                footText="Assigned"
              />
            </div>

            {/* Event info card */}
            <div className="bg-surface border border-border rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-border">
                <h2 className="font-display font-semibold text-[17px] text-text m-0">Event information</h2>
              </div>
              <div className="p-6">
                {/* Poster preview — real image if uploaded, else gradient */}
                {ev.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={ev.image}
                    alt={`${ev.name} poster`}
                    className="w-full h-48 object-cover rounded-md mb-5"
                  />
                ) : (
                  <div
                    className="w-full h-48 rounded-md mb-5"
                    style={{ backgroundImage: ev.poster, backgroundSize: "cover", backgroundPosition: "center" }}
                    aria-label="Event poster"
                  />
                )}
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  <div>
                    <div className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1">Venue</div>
                    <div className="font-semibold text-text">{ev.venue}</div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1">Date</div>
                    <div className="font-semibold text-text">{ev.date}</div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1">Category</div>
                    <div className="font-semibold text-text">{ev.category}</div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1">Time</div>
                    <div className="font-semibold text-text">{ev.time}</div>
                  </div>
                  {ev.city && (
                    <div>
                      <div className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1">City</div>
                      <div className="font-semibold text-text">{ev.city}</div>
                    </div>
                  )}
                  {ev.description && (
                    <div className="col-span-2">
                      <div className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1">About</div>
                      <div className="text-text-secondary text-sm leading-relaxed">{ev.description}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Entry rate chart */}
            {lineData.length > 0 && (
              <div className="bg-surface border border-border rounded-lg p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-semibold text-[17px] text-text m-0">Entry rate</h3>
                  <span className="text-sm text-text-muted">Admissions per 30 min</span>
                </div>
                <LineChart data={lineData} />
              </div>
            )}

            {/* Tier breakdown chart */}
            {barData.length > 0 && (
              <div className="bg-surface border border-border rounded-lg p-5">
                <h3 className="font-display font-semibold text-[17px] text-text mb-3 m-0">Tier breakdown</h3>
                <HBarChart data={barData} />
              </div>
            )}
          </div>
        )}

        {/* ── TICKET CATEGORIES ── */}
        {tab === "categories" && (
          <div className="bg-surface border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm" aria-label="Ticket categories">
                <thead>
                  <tr className="border-b border-border bg-surface-bg">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Category</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Price</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Sold</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide min-w-40">Capacity</th>
                  </tr>
                </thead>
                <tbody>
                  {ev.tiers.map((t) => {
                    const sold = t.capacity - t.remaining;
                    const pct  = t.capacity > 0 ? Math.round((sold / t.capacity) * 100) : 0;
                    return (
                      <tr key={t.id} className="border-b border-border/50 last:border-b-0 hover:bg-surface-bg/50">
                        <td className="px-5 py-4 font-semibold">{t.name}</td>
                        <td className="px-4 py-4 font-mono text-[13px]">{formatSSP(t.price)}</td>
                        <td className="px-4 py-4 font-mono text-[13px]">{sold.toLocaleString()}</td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 rounded-pill bg-border overflow-hidden min-w-20">
                              <div
                                className={cn("h-full rounded-pill", progressColor(pct))}
                                style={{ width: `${pct}%` }}
                                role="progressbar"
                                aria-valuenow={pct}
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-label={`${pct}% of capacity sold`}
                              />
                            </div>
                            <span className="font-mono text-[13px] text-text-secondary whitespace-nowrap">
                              {pct}% of {t.capacity.toLocaleString()}
                            </span>
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

        {/* ── GATE AGENTS ── */}
        {tab === "agents" && (
          <div className="bg-surface border border-border rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="font-display font-semibold text-[17px] text-text m-0">Assigned gate agents</h2>
              <Button size="sm" className="gap-2" onClick={() => router.push("/organizer/gate-agents")}>
                <Icon name="UserPlus" size={15} />
                Add gate agent
              </Button>
            </div>
            {agentsLoading ? (
              <div className="p-5 flex flex-col gap-3">
                <SkeletonCard className="h-12" />
                <SkeletonCard className="h-12" />
              </div>
            ) : agents.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  icon="Users"
                  heading="No agents assigned to this event"
                  subtext="Go to Gate Agents to assign agents."
                />
              </div>
            ) : (
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
            )}
          </div>
        )}

        {/* ── REPORTS ── */}
        {tab === "reports" && (
          <div className="bg-surface border border-border rounded-lg p-6">
            <EmptyState
              icon="ChartBar"
              heading="Full report available after the event"
              subtext="Live attendance is on the dashboard. A complete post-event report unlocks once this event is marked completed."
            />
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════
          EDIT EVENT MODAL — full fields matching create form
      ════════════════════════════════════════════════════════════ */}
      {editOpen && (
        <Modal
          open
          title="Edit event"
          description="Update the event details below."
          onClose={handleCloseEdit}
          footer={
            <>
              <Button variant="ghost" onClick={handleCloseEdit} disabled={updateEvent.isPending}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveEdit}
                disabled={updateEvent.isPending || uploading}
                className="gap-2"
                aria-label="Save changes"
              >
                {updateEvent.isPending ? (
                  <>
                    <Icon name="Loader" size={15} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Icon name="Check" size={15} />
                    Save changes
                  </>
                )}
              </Button>
            </>
          }
        >
          <div className="flex flex-col gap-4 py-2">
            {updateEvent.isError && (
              <AlertBanner
                tone="danger"
                title="Update failed"
                message={updateEvent.error?.message ?? "Please try again."}
              />
            )}

            {/* Title */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="edit-title" className="text-sm font-semibold text-text">
                Event title <span className="text-status-danger">*</span>
              </label>
              <input
                id="edit-title"
                type="text"
                value={edit.title}
                onChange={(e) => setField("title")(e.target.value)}
                placeholder="e.g. Juba Music Festival 2025"
                aria-label="Event title"
                aria-invalid={!!titleErr}
                className={cn(
                  "w-full h-11 px-3.5 rounded-sm border bg-white text-text text-[15px] placeholder:text-text-muted transition-colors",
                  "focus:outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20",
                  titleErr ? "border-status-danger" : "border-border",
                )}
              />
              {titleErr && <p role="alert" className="text-xs text-status-danger font-semibold">{titleErr}</p>}
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="edit-desc" className="text-sm font-semibold text-text">
                Description
              </label>
              <textarea
                id="edit-desc"
                value={edit.description}
                onChange={(e) => setField("description")(e.target.value)}
                rows={3}
                placeholder="Describe your event..."
                aria-label="Event description"
                className="w-full px-3.5 py-3 rounded-sm border border-border bg-white text-text text-[15px] placeholder:text-text-muted resize-none focus:outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 transition-colors"
              />
            </div>

            {/* Venue + City */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="edit-venue" className="text-sm font-semibold text-text">
                  Venue <span className="text-status-danger">*</span>
                </label>
                <input
                  id="edit-venue"
                  type="text"
                  value={edit.venue}
                  onChange={(e) => setField("venue")(e.target.value)}
                  placeholder="e.g. Nyakuron Cultural Centre"
                  aria-label="Venue"
                  aria-invalid={!!venueErr}
                  className={cn(
                    "w-full h-11 px-3.5 rounded-sm border bg-white text-text text-[15px] placeholder:text-text-muted transition-colors",
                    "focus:outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20",
                    venueErr ? "border-status-danger" : "border-border",
                  )}
                />
                {venueErr && <p role="alert" className="text-xs text-status-danger font-semibold">{venueErr}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="edit-city" className="text-sm font-semibold text-text">City</label>
                <input
                  id="edit-city"
                  type="text"
                  value={edit.city}
                  onChange={(e) => setField("city")(e.target.value)}
                  placeholder="e.g. Juba"
                  aria-label="City"
                  className="w-full h-11 px-3.5 rounded-sm border border-border bg-white text-text text-[15px] placeholder:text-text-muted focus:outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 transition-colors"
                />
              </div>
            </div>

            {/* Date + Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="edit-date" className="text-sm font-semibold text-text">Date</label>
                <input
                  id="edit-date"
                  type="date"
                  value={edit.date}
                  onChange={(e) => setField("date")(e.target.value)}
                  aria-label="Event date"
                  aria-invalid={!!dateErr}
                  className={cn(
                    "w-full h-11 px-3.5 rounded-sm border bg-white text-text text-[15px] transition-colors",
                    "focus:outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20",
                    dateErr ? "border-status-danger" : "border-border",
                  )}
                />
                {dateErr && <p role="alert" className="text-xs text-status-danger font-semibold">{dateErr}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="edit-time" className="text-sm font-semibold text-text">Time</label>
                <input
                  id="edit-time"
                  type="time"
                  value={edit.time}
                  onChange={(e) => setField("time")(e.target.value)}
                  aria-label="Event time"
                  className="w-full h-11 px-3.5 rounded-sm border border-border bg-white text-text text-[15px] focus:outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 transition-colors"
                />
              </div>
            </div>

            {/* Category + Status */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="edit-category" className="text-sm font-semibold text-text">
                  Category <span className="text-status-danger">*</span>
                </label>
                <div className="relative">
                  <select
                    id="edit-category"
                    value={edit.category}
                    onChange={(e) => setField("category")(e.target.value)}
                    aria-label="Event category"
                    aria-invalid={!!categoryErr}
                    className={cn(
                      "w-full h-11 px-3.5 pr-9 rounded-sm border bg-white text-text text-[15px] appearance-none transition-colors",
                      "focus:outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20",
                      categoryErr ? "border-status-danger" : "border-border",
                      !edit.category && "text-text-muted",
                    )}
                  >
                    <option value="" disabled>Select category</option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <Icon name="ChevronDown" size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                </div>
                {categoryErr && <p role="alert" className="text-xs text-status-danger font-semibold">{categoryErr}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="edit-status" className="text-sm font-semibold text-text">Status</label>
                <div className="relative">
                  <select
                    id="edit-status"
                    value={edit.status}
                    onChange={(e) => setField("status")(e.target.value)}
                    aria-label="Event status"
                    className="w-full h-11 px-3.5 pr-9 rounded-sm border border-border bg-white text-text text-[15px] appearance-none focus:outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 transition-colors"
                  >
                    {EVENT_STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                  <Icon name="ChevronDown" size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Poster upload */}
            <div className="flex flex-col gap-1.5">
              <div className="text-sm font-semibold text-text">Event poster</div>
              <CldUploadWidget
                uploadPreset={UPLOAD_PRESET}
                options={{ sources: ["local", "url"], multiple: false, maxFiles: 1 }}
                onOpen={() => setUploading(true)}
                onSuccess={(result) => {
                  setUploading(false);
                  if (result.event !== "success") return;
                  const info = result.info as CloudinaryResult;
                  setField("imageUrl")(info.secure_url);
                }}
                onError={() => setUploading(false)}
              >
                {({ open }) => (
                  <button
                    type="button"
                    onClick={() => open()}
                    disabled={uploading}
                    aria-label="Upload event poster"
                    className={cn(
                      "w-full flex flex-col items-center justify-center gap-2 px-6 py-6 border-2 border-dashed rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange",
                      edit.imageUrl
                        ? "border-status-success bg-status-success-bg"
                        : "border-border bg-surface-bg hover:border-brand-orange/40",
                      uploading && "opacity-60 cursor-wait",
                    )}
                  >
                    {edit.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={edit.imageUrl}
                        alt="Event poster preview"
                        className="w-full max-h-32 object-cover rounded-md mb-1"
                      />
                    ) : (
                      <Icon
                        name={uploading ? "Loader" : "CloudUpload"}
                        size={24}
                        className={cn("text-text-muted", uploading && "animate-spin")}
                      />
                    )}
                    <p className="text-sm font-semibold text-text">
                      {uploading ? "Uploading…" : edit.imageUrl ? "Poster uploaded · click to change" : "Upload poster"}
                    </p>
                    {!edit.imageUrl && !uploading && (
                      <p className="text-xs text-text-muted">PNG, JPG or WebP · max 5 MB</p>
                    )}
                  </button>
                )}
              </CldUploadWidget>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Cancel Event Confirm Modal ── */}
      {cancelOpen && (
        <Modal
          open
          title="Cancel event?"
          description={`"${ev.name}" will be marked cancelled and hidden from attendees. This cannot be undone.`}
          onClose={() => { if (!deleteEvent.isPending) { setCancelOpen(false); deleteEvent.reset(); } }}
          footer={
            <>
              <Button
                variant="ghost"
                onClick={() => { setCancelOpen(false); deleteEvent.reset(); }}
                disabled={deleteEvent.isPending}
              >
                Keep event
              </Button>
              <Button
                onClick={handleCancelEvent}
                disabled={deleteEvent.isPending}
                className="gap-2 bg-status-danger hover:bg-status-danger/90 border-status-danger"
                aria-label="Confirm cancel event"
              >
                {deleteEvent.isPending ? (
                  <>
                    <Icon name="Loader" size={15} className="animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  <>
                    <Icon name="Trash2" size={15} />
                    Yes, cancel event
                  </>
                )}
              </Button>
            </>
          }
        >
          {deleteEvent.isError && (
            <AlertBanner
              tone="danger"
              title="Could not cancel event"
              message={deleteEvent.error?.message ?? "Please try again."}
            />
          )}
        </Modal>
      )}
    </div>
  );
}
