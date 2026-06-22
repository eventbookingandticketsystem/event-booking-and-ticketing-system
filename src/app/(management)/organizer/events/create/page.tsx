'use client';

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CldUploadWidget } from "next-cloudinary";
import { OrgTopbar } from "@/components/Organizer/OrgTopbar";
import { Button } from "@/components/Shared/Button";
import { Icon } from "@/components/Shared/Icon";
import { AlertBanner } from "@/components/Shared/AlertBanner";
import { cn } from "@/lib/utils";
import { useCreateEvent } from "@/lib/api/hooks/useCreateEvent";
import { ROUTES } from "@/constants/routes";

const STEP_LABELS = ["Event details", "Ticket categories", "Review & publish"];

// Predefined suggestions — user can also type anything freely
const EVENT_CATEGORY_SUGGESTIONS = [
  "Music", "Sports", "Conference", "Graduation", "Church",
  "Food & Drinks", "Arts & Culture", "Comedy", "Fashion", "Tech",
  "Networking", "Workshop", "Exhibition", "Other",
];

const TIER_NAME_SUGGESTIONS = [
  "General Admission", "VIP", "VIP Standing", "VIP Table",
  "Early Bird", "Regular", "Premium", "Backstage Pass",
  "Student", "Family Bundle", "Group (10+)",
];

const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? "tiketi_events";

interface CloudinaryResult {
  public_id: string;
  secure_url: string;
}

interface CatBlock {
  name: string;
  price: string;
  capacity: string;
  open: string;
  close: string;
}

interface Step1Fields {
  title: string;
  desc: string;
  venue: string;
  city: string;
  date: string;
  time: string;
  category: string;
  imageUrl: string;
}

function isFutureDate(d: string): boolean {
  if (!d) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(d) >= today;
}

// ── ComboInput ────────────────────────────────────────────────────────────────
// Free-type input with suggestion dropdown.
// - Shows suggestions filtered by what the user types (case-insensitive)
// - Deduplicates: extra values passed via `extra` (e.g. already-used names)
//   appear at the top, existing suggestions below, no duplicates shown
// - User can type anything not in the list and it's accepted as-is
interface ComboInputProps {
  value: string;
  onChange: (v: string) => void;
  suggestions: string[];
  extra?: string[];        // additional suggestions (e.g. already-used tier names)
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  id?: string;
}

function ComboInput({
  value, onChange, suggestions, extra = [],
  placeholder, error, disabled, id,
}: ComboInputProps) {
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Merge extra + suggestions, deduplicate case-insensitively, preserve order
  const allSuggestions = [
    ...extra,
    ...suggestions.filter(
      (s) => !extra.some((e) => e.toLowerCase() === s.toLowerCase()),
    ),
  ];

  // Filter by what the user typed, skip exact match (already selected)
  const filtered = value.trim()
    ? allSuggestions.filter(
        (s) =>
          s.toLowerCase().includes(value.toLowerCase()) &&
          s.toLowerCase() !== value.toLowerCase(),
      )
    : allSuggestions;

  const showDropdown = open && focused && filtered.length > 0;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setFocused(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <div
        className={cn(
          "flex items-stretch h-11 border rounded-sm bg-white transition-colors",
          error
            ? "border-status-danger"
            : focused
            ? "border-brand-orange ring-2 ring-brand-orange/20"
            : "border-border",
          disabled && "opacity-60",
        )}
      >
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => { setFocused(true); setOpen(true); }}
          onBlur={() => {
            // small delay so click on option registers before blur closes
            setTimeout(() => setFocused(false), 150);
          }}
          aria-autocomplete="list"
          aria-expanded={showDropdown}
          className="flex-1 border-none outline-none bg-transparent px-3.5 text-[15px] text-text font-body placeholder:text-text-muted min-w-0"
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => { setOpen((o) => !o); inputRef.current?.focus(); }}
          aria-label="Show suggestions"
          className="px-2.5 text-text-muted hover:text-text"
        >
          <Icon name={open && focused ? "ChevronUp" : "ChevronDown"} size={15} />
        </button>
      </div>

      {showDropdown && (
        <ul
          role="listbox"
          className="absolute top-[calc(100%+4px)] left-0 right-0 z-50 bg-white border border-border rounded-md shadow-pop max-h-[220px] overflow-y-auto"
        >
          {filtered.map((s) => (
            <li key={s}>
              <button
                type="button"
                role="option"
                aria-selected={s.toLowerCase() === value.toLowerCase()}
                onMouseDown={(e) => {
                  e.preventDefault(); // prevent blur before click
                  onChange(s);
                  setOpen(false);
                  setFocused(false);
                }}
                className={cn(
                  "w-full text-left px-3.5 py-2.5 text-[14px] font-body text-text hover:bg-surface-bg transition-colors",
                  s.toLowerCase() === value.toLowerCase() && "bg-surface-alt font-semibold",
                  extra.some((e) => e.toLowerCase() === s.toLowerCase()) &&
                    "border-l-2 border-brand-orange",
                )}
              >
                {s}
                {extra.some((e) => e.toLowerCase() === s.toLowerCase()) && (
                  <span className="ml-2 text-[11px] text-text-muted font-normal">already used</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Step indicator ────────────────────────────────────────────────────────────
function StepIndicator({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEP_LABELS.map((label, i) => {
        const n = i + 1;
        const done = step > n;
        const active = step === n;
        return (
          <div key={label} className="flex items-center gap-0">
            {i > 0 && (
              <div className={cn("h-px w-12 mx-1 transition-colors", done ? "bg-status-success" : "bg-border")} />
            )}
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "w-7 h-7 rounded-full inline-flex items-center justify-center text-sm font-bold border-2 transition-all",
                  active && "border-brand-orange bg-brand-orange text-white",
                  done && "border-status-success bg-status-success text-white",
                  !active && !done && "border-border bg-surface text-text-muted",
                )}
              >
                {done ? <Icon name="Check" size={14} strokeWidth={3} /> : n}
              </span>
              <span className={cn("text-sm font-semibold hidden sm:inline", active && "text-text", done && "text-status-success", !active && !done && "text-text-muted")}>
                {label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Field wrapper ─────────────────────────────────────────────────────────────
function FieldWrap({ label, error, children, hint }: { label: string; error?: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-text font-body">{label}</label>
      {children}
      {error && (
        <p role="alert" className="text-xs text-status-danger font-semibold flex items-center gap-1">
          <Icon name="CircleAlert" size={12} /> {error}
        </p>
      )}
      {!error && hint && <p className="text-xs text-text-muted">{hint}</p>}
    </div>
  );
}

// ── Shared input primitives ───────────────────────────────────────────────────
function TextInput({ value, onChange, placeholder, disabled, error, type = "text" }: {
  value: string; onChange: (v: string) => void; placeholder?: string;
  disabled?: boolean; error?: string; type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className={cn(
        "w-full h-11 px-3.5 rounded-sm border bg-white text-text text-[15px] font-body transition-colors",
        "placeholder:text-text-muted focus:outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 disabled:opacity-60",
        error ? "border-status-danger" : "border-border",
      )}
    />
  );
}

function TextArea({ value, onChange, placeholder, error }: {
  value: string; onChange: (v: string) => void; placeholder?: string; error?: string;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={4}
      className={cn(
        "w-full px-3.5 py-2.5 rounded-sm border bg-white text-text text-[15px] font-body transition-colors resize-y",
        "placeholder:text-text-muted focus:outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20",
        error ? "border-status-danger" : "border-border",
      )}
    />
  );
}

function NumInput({ value, onChange, placeholder, min, error }: {
  value: string; onChange: (v: string) => void; placeholder?: string;
  min?: number; error?: string;
}) {
  return (
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/[^0-9.]/g, ""))}
      placeholder={placeholder}
      min={min}
      className={cn(
        "w-full h-11 px-3.5 rounded-sm border bg-white text-text text-[15px] font-body transition-colors",
        "placeholder:text-text-muted focus:outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20",
        error ? "border-status-danger" : "border-border",
      )}
    />
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function CreateEventPage() {
  const router = useRouter();
  const createEvent = useCreateEvent();

  const [step,        setStep]        = useState(1);
  const [touched1,    setTouched1]    = useState(false);
  const [touched2,    setTouched2]    = useState(false);
  const [uploading,   setUploading]   = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);

  const [f, setF] = useState<Step1Fields>({
    title: "", desc: "", venue: "", city: "",
    date: "", time: "", category: "", imageUrl: "",
  });
  const set = (k: keyof Step1Fields) => (v: string) => setF((prev) => ({ ...prev, [k]: v }));

  const [cats, setCats] = useState<CatBlock[]>([
    { name: "", price: "", capacity: "", open: "", close: "" },
  ]);

  // Collect already-used tier names for suggestions (deduplicated, case-insensitive)
  const usedTierNames = Array.from(
    new Set(cats.map((c) => c.name.trim()).filter(Boolean).map((n) => n)),
  );

  // ── Validation ────────────────────────────────────────────────────────────
  const e1 = {
    title:    !f.title.trim() ? "Event title is required" : f.title.trim().length < 5 ? "At least 5 characters" : "",
    desc:     !f.desc.trim() ? "Description is required" : f.desc.trim().length < 20 ? "At least 20 characters" : "",
    venue:    !f.venue.trim() ? "Venue is required" : "",
    city:     !f.city.trim() ? "City is required" : "",
    date:     !f.date ? "Pick a date" : !isFutureDate(f.date) ? "Must be a future date" : "",
    time:     !f.time ? "Pick a time" : "",
    category: !f.category.trim() ? "Choose a category" : "",
  };
  const step1Valid = !Object.values(e1).some(Boolean);
  const err1 = (k: keyof typeof e1) => (touched1 ? e1[k] : "");

  const catErr = (c: CatBlock) => ({
    name:     !c.name.trim() ? "Required" : "",
    price:    c.price === "" ? "Required" : Number(c.price) < 0 ? "Min $0" : "",
    capacity: c.capacity === "" ? "Required" : Number(c.capacity) < 1 ? "Min 1" : "",
    open:     !c.open ? "Required" : "",
    close:    !c.close ? "Required"
      : (c.open && c.close < c.open) ? "Must be after sale opens"
      : (f.date && c.close > f.date) ? "Must be on or before event date"
      : "",
  });
  const step2Valid = cats.length >= 1 && cats.every((c) => !Object.values(catErr(c)).some(Boolean));
  const ce = (c: CatBlock, k: keyof ReturnType<typeof catErr>) => (touched2 ? catErr(c)[k] : "");

  const setCat = (i: number, k: keyof CatBlock, v: string) =>
    setCats((prev) => prev.map((c, j) => j === i ? { ...c, [k]: v } : c));
  const addCat = () => {
    if (cats.length < 10) setCats((p) => [...p, { name: "", price: "", capacity: "", open: "", close: "" }]);
  };
  const rmCat = (i: number) => setCats((p) => p.filter((_, j) => j !== i));

  const next = () => {
    if (step === 1) { setTouched1(true); if (!step1Valid) return; }
    if (step === 2) { setTouched2(true); if (!step2Valid) return; }
    setStep((s) => s + 1);
  };

  const checks = [
    { label: "Event title",       ok: !e1.title },
    { label: "Description",       ok: !e1.desc },
    { label: "Venue & city",      ok: !e1.venue && !e1.city },
    { label: "Date & time",       ok: !e1.date && !e1.time },
    { label: "Category",          ok: !e1.category },
    { label: "Ticket categories", ok: step2Valid },
  ];
  const allValid = checks.every((c) => c.ok);

  function toIsoDatetime(date: string, time: string): string {
    const [hours, minutes] = time ? time.split(":").map(Number) : [0, 0];
    const d = new Date(date);
    d.setHours(hours, minutes ?? 0, 0, 0);
    return d.toISOString();
  }

  function buildPayload(status: "PUBLISHED" | "DRAFT") {
    return {
      title:       f.title,
      description: f.desc || undefined,
      venue:       f.venue,
      city:        f.city,
      date:        toIsoDatetime(f.date, f.time),
      time:        f.time,
      category:    f.category,
      status,
      ...(f.imageUrl ? { image: f.imageUrl } : {}),
      tiers: cats.map((c) => ({
        name:       c.name,
        price:      Number(c.price),
        capacity:   Number(c.capacity),
        saleOpens:  c.open  ? toIsoDatetime(c.open,  "00:00") : undefined,
        saleCloses: c.close ? toIsoDatetime(c.close, "23:59") : undefined,
      })),
    };
  }

  const publish = async () => {
    if (!allValid || createEvent.isPending || savingDraft) return;
    try {
      await createEvent.mutateAsync(buildPayload("PUBLISHED"));
      router.push(ROUTES.ORGANIZER_EVENTS);
    } catch { /* surfaced via createEvent.error */ }
  };

  const saveAsDraft = async () => {
    if (createEvent.isPending || savingDraft) return;
    setTouched1(true);
    if (!step1Valid) return;
    setSavingDraft(true);
    try {
      await createEvent.mutateAsync(buildPayload("DRAFT"));
      router.push(ROUTES.ORGANIZER_EVENTS);
    } catch { /* surfaced via createEvent.error */ }
    finally { setSavingDraft(false); }
  };

  return (
    <div className="flex flex-col min-h-full">
      <OrgTopbar crumb="Create Event" />

      <div className="px-6 pt-5 pb-10">
        <div className="flex items-center gap-1.5 text-sm font-body mb-3">
          <button type="button" onClick={() => router.push(ROUTES.ORGANIZER_EVENTS)} className="text-text-secondary hover:text-text transition-colors focus-visible:outline-none">
            My events
          </button>
          <Icon name="ChevronRight" size={14} className="text-text-muted" />
          <span className="text-text font-semibold">Create event</span>
        </div>

        <h1 className="font-display font-bold text-[26px] text-text mb-6">Create event</h1>
        <StepIndicator step={step} />

        {createEvent.isError && step !== 3 && (
          <div className="max-w-[760px] mb-4">
            <AlertBanner tone="danger" title="Could not save event" message={createEvent.error?.message ?? "An error occurred. Please try again."} />
          </div>
        )}

        <div className="max-w-[760px]">

          {/* ── STEP 1 — Event details ──────────────────────────────────── */}
          {step === 1 && (
            <div className="bg-surface border border-border rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-border">
                <h2 className="font-display font-semibold text-[17px] text-text m-0">Event details</h2>
              </div>
              <div className="p-6 flex flex-col gap-5">

                <FieldWrap label="Event title" error={err1("title")}>
                  <TextInput value={f.title} onChange={set("title")} placeholder="e.g. Summer Concert 2025" error={err1("title")} />
                </FieldWrap>

                <FieldWrap label="Description" error={err1("desc")} hint="At least 20 characters">
                  <TextArea value={f.desc} onChange={set("desc")} placeholder="Tell attendees what to expect…" error={err1("desc")} />
                </FieldWrap>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <FieldWrap label="Venue" error={err1("venue")}>
                    <TextInput value={f.venue} onChange={set("venue")} placeholder="e.g. City Arena" error={err1("venue")} />
                  </FieldWrap>
                  <FieldWrap label="City" error={err1("city")}>
                    <TextInput value={f.city} onChange={set("city")} placeholder="e.g. Nairobi" error={err1("city")} />
                  </FieldWrap>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <FieldWrap label="Date" error={err1("date")}>
                    <TextInput type="date" value={f.date} onChange={set("date")} error={err1("date")} />
                  </FieldWrap>
                  <FieldWrap label="Time" error={err1("time")}>
                    <TextInput type="time" value={f.time} onChange={set("time")} error={err1("time")} />
                  </FieldWrap>
                </div>

                {/* Category — ComboInput with suggestions + free-type */}
                <FieldWrap label="Category" error={err1("category")} hint="Select from the list or type your own">
                  <ComboInput
                    value={f.category}
                    onChange={set("category")}
                    suggestions={EVENT_CATEGORY_SUGGESTIONS}
                    placeholder="e.g. Music, Conference, Sports…"
                    error={err1("category")}
                  />
                </FieldWrap>

                {/* Cloudinary poster upload */}
                <FieldWrap label="Event poster (optional)" hint="Recommended 1200×628px · PNG or JPG · max 5 MB">
                  <CldUploadWidget
                    uploadPreset={UPLOAD_PRESET}
                    options={{ sources: ["local", "url"], multiple: false, maxFiles: 1, clientAllowedFormats: ["jpg", "jpeg", "png", "webp"], maxFileSize: 5_242_880 }}
                    onQueuesStart={() => setUploading(true)}
                    onSuccess={(result) => {
                      setUploading(false);
                      if (result.event !== "success") return;
                      const info = result.info as CloudinaryResult;
                      set("imageUrl")(info.secure_url);
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
                          "w-full flex flex-col items-center justify-center gap-2 px-6 py-8 border-2 border-dashed rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange",
                          f.imageUrl ? "border-status-success bg-status-success-bg" : "border-border bg-surface-bg hover:border-brand-orange/40",
                          uploading && "opacity-60 cursor-wait",
                        )}
                      >
                        {f.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={f.imageUrl} alt="Event poster preview" className="w-full max-h-40 object-cover rounded-md mb-1" />
                        ) : (
                          <Icon name={uploading ? "Loader" : "CloudUpload"} size={26} className={cn("text-text-muted", uploading && "animate-spin")} />
                        )}
                        <p className="text-sm font-semibold text-text">
                          {uploading ? "Uploading…" : f.imageUrl ? "Poster uploaded · click to change" : "Upload event poster"}
                        </p>
                        {!f.imageUrl && !uploading && <p className="text-xs text-text-muted">PNG, JPG or WebP · max 5 MB</p>}
                      </button>
                    )}
                  </CldUploadWidget>
                </FieldWrap>

                <div className="flex items-center justify-between pt-2">
                  <Button variant="ghost" onClick={saveAsDraft} disabled={savingDraft} className="gap-2 text-text-secondary" aria-label="Save as draft">
                    {savingDraft ? <><Icon name="Loader" size={14} className="animate-spin" /> Saving…</> : <><Icon name="Save" size={14} /> Save as draft</>}
                  </Button>
                  <Button onClick={next} className="gap-2">
                    Next <Icon name="ArrowRight" size={16} />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 2 — Ticket categories ──────────────────────────────── */}
          {step === 2 && (
            <div className="bg-surface border border-border rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                <h2 className="font-display font-semibold text-[17px] text-text m-0">Ticket categories</h2>
                <span className="text-sm text-text-muted">{cats.length} / 10</span>
              </div>
              <div className="p-6 flex flex-col gap-5">
                {cats.map((c, i) => (
                  <div key={i} className="border border-border rounded-md overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 bg-surface-bg border-b border-border">
                      <span className="text-sm font-semibold text-text">Category {i + 1}</span>
                      {cats.length > 1 && (
                        <button
                          type="button"
                          onClick={() => rmCat(i)}
                          aria-label={`Remove category ${i + 1}`}
                          className="w-7 h-7 rounded border border-border text-status-danger inline-flex items-center justify-center hover:bg-status-danger-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-danger"
                        >
                          <Icon name="Trash2" size={14} />
                        </button>
                      )}
                    </div>
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">

                      {/* Category name — ComboInput with tier name suggestions */}
                      <div className="md:col-span-2">
                        <FieldWrap label="Category name" error={ce(c, "name")} hint="Select a common name or type your own">
                          <ComboInput
                            value={c.name}
                            onChange={(v) => setCat(i, "name", v)}
                            suggestions={TIER_NAME_SUGGESTIONS}
                            extra={usedTierNames.filter((n) => n.toLowerCase() !== c.name.toLowerCase())}
                            placeholder="e.g. General Admission, VIP…"
                            error={ce(c, "name")}
                          />
                        </FieldWrap>
                      </div>

                      {/* Price — USD */}
                      <FieldWrap label="Price (USD)" error={ce(c, "price")}>
                        <NumInput value={c.price} onChange={(v) => setCat(i, "price", v)} placeholder="0" min={0} error={ce(c, "price")} />
                      </FieldWrap>

                      <FieldWrap label="Capacity" error={ce(c, "capacity")}>
                        <NumInput value={c.capacity} onChange={(v) => setCat(i, "capacity", v)} placeholder="0" min={1} error={ce(c, "capacity")} />
                      </FieldWrap>

                      <FieldWrap label="Sale opens" error={ce(c, "open")}>
                        <TextInput type="date" value={c.open} onChange={(v) => setCat(i, "open", v)} error={ce(c, "open")} />
                      </FieldWrap>

                      <FieldWrap label="Sale closes" error={ce(c, "close")}>
                        <TextInput type="date" value={c.close} onChange={(v) => setCat(i, "close", v)} error={ce(c, "close")} />
                      </FieldWrap>
                    </div>
                  </div>
                ))}

                <Button variant="ghost" size="sm" disabled={cats.length >= 10} onClick={addCat} className="gap-2 self-start">
                  <Icon name="Plus" size={15} /> Add category
                </Button>

                <div className="flex items-center justify-between pt-2">
                  <Button variant="ghost" onClick={() => setStep(1)} className="gap-2">
                    <Icon name="ArrowLeft" size={16} /> Back
                  </Button>
                  <div className="flex gap-3">
                    <Button variant="ghost" onClick={saveAsDraft} disabled={savingDraft} className="gap-2 text-text-secondary">
                      {savingDraft ? <><Icon name="Loader" size={14} className="animate-spin" /> Saving…</> : <><Icon name="Save" size={14} /> Save as draft</>}
                    </Button>
                    <Button onClick={next} className="gap-2">
                      Next <Icon name="ArrowRight" size={16} />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 3 — Review & publish ───────────────────────────────── */}
          {step === 3 && (
            <div className="flex flex-col gap-4">
              <div className="bg-surface border border-border rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-border">
                  <h2 className="font-display font-semibold text-[17px] text-text m-0">Review</h2>
                </div>
                <div className="p-6 flex flex-col gap-5">
                  {f.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={f.imageUrl} alt="Event poster" className="w-full max-h-52 object-cover rounded-lg" />
                  )}
                  <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                    {[
                      { label: "Title",       value: f.title || "—" },
                      { label: "Category",    value: f.category || "—" },
                      { label: "Venue",       value: f.venue || "—" },
                      { label: "City",        value: f.city || "—" },
                      { label: "Date & time", value: f.date ? `${f.date} ${f.time}` : "—" },
                      { label: "Poster",      value: f.imageUrl ? "Uploaded ✓" : "No poster" },
                    ].map((row) => (
                      <div key={row.label}>
                        <div className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1">{row.label}</div>
                        <div className={cn("font-semibold text-text", row.label === "Poster" && f.imageUrl && "text-status-success")}>{row.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-surface border border-border rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-border">
                  <h2 className="font-display font-semibold text-[17px] text-text m-0">Ticket categories</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-surface-bg">
                        <th className="text-left px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Category</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Price (USD)</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Capacity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cats.map((c, i) => (
                        <tr key={i} className="border-b border-border/50 last:border-b-0">
                          <td className="px-5 py-3 font-semibold">{c.name || `Category ${i + 1}`}</td>
                          <td className="px-4 py-3 font-mono text-[13px]">
                            {c.price ? `$${Number(c.price).toLocaleString("en-US")}` : "—"}
                          </td>
                          <td className="px-4 py-3 font-mono text-[13px]">{c.capacity || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-surface border border-border rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-border">
                  <h2 className="font-display font-semibold text-[17px] text-text m-0">Validation summary</h2>
                </div>
                <div className="divide-y divide-border">
                  {checks.map((c) => (
                    <div key={c.label} className="flex items-center gap-3 px-5 py-3.5">
                      <Icon name={c.ok ? "CircleCheck" : "CircleX"} size={18} className={c.ok ? "text-status-success shrink-0" : "text-status-danger shrink-0"} />
                      <span className="flex-1 text-sm font-medium text-text">{c.label}</span>
                      <span className={cn("text-sm font-semibold", c.ok ? "text-status-success" : "text-status-danger")}>
                        {c.ok ? "Valid" : "Needs attention"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <AlertBanner tone="warning" title="Publishing makes this event visible to all attendees." message="You can still edit details after publishing." />

              {createEvent.isError && (
                <AlertBanner tone="danger" title="Could not publish event" message={createEvent.error?.message ?? "An error occurred. Please try again."} />
              )}

              <div className="flex items-center justify-between pt-1">
                <Button variant="ghost" onClick={() => setStep(2)} disabled={createEvent.isPending || savingDraft} className="gap-2">
                  <Icon name="ArrowLeft" size={16} /> Back
                </Button>
                <div className="flex gap-3">
                  <Button variant="ghost" onClick={saveAsDraft} disabled={createEvent.isPending || savingDraft} className="gap-2">
                    {savingDraft ? <><Icon name="Loader" size={15} className="animate-spin" /> Saving draft…</> : <><Icon name="Save" size={15} /> Save as draft</>}
                  </Button>
                  <Button onClick={publish} disabled={!allValid || createEvent.isPending || savingDraft} className="gap-2">
                    {createEvent.isPending ? <><Icon name="Loader" size={15} className="animate-spin" /> Publishing…</> : <><Icon name="Send" size={16} /> Publish event</>}
                  </Button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
