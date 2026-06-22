"use client";

import { useState, useEffect } from "react";
import { CldUploadWidget } from "next-cloudinary";
import { OrgTopbar } from "@/components/Organizer/OrgTopbar";
import { Modal } from "@/components/Shared/Modal";
import { Button } from "@/components/Shared/Button";
import { Icon } from "@/components/Shared/Icon";
import { PhoneInput } from "@/components/Shared/PhoneInput";
import { AlertBanner } from "@/components/Shared/AlertBanner";
import { SkeletonCard } from "@/components/Shared/SkeletonCard";
import { initials } from "@/components/Organizer/OrgTopbar";
import {
  DEFAULT_PHONE,
  PHONE_COUNTRIES,
  type PhoneValue,
} from "@/constants/countries";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/lib/api/hooks/useCurrentUser";
import { useUpdateProfile } from "@/lib/api/hooks/useCurrentUser";

const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? "tiketi_events";

interface CloudinaryResult {
  public_id: string;
  secure_url: string;
}

const API_KEY = "atsk_live_7f3c9a21b8e4d6105fa2c0993ee1";

interface Notif {
  booking: boolean;
  fraud: boolean;
  daily: boolean;
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={cn(
        "relative inline-flex w-11 h-6 rounded-pill transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange shrink-0",
        checked ? "bg-brand-orange" : "bg-border",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200",
          checked ? "translate-x-5" : "translate-x-0",
        )}
      />
    </button>
  );
}

/** Parse a full phone string like "+211922700145" into a PhoneValue. */
function parsePhone(full: string | null): PhoneValue {
  if (!full) return DEFAULT_PHONE;
  const country = PHONE_COUNTRIES.find((c) => full.startsWith(c.dial));
  if (!country) return { ...DEFAULT_PHONE, num: full.replace(/\D/g, "") };
  return {
    dial: country.dial,
    code: country.code,
    num: full.slice(country.dial.length).replace(/\D/g, ""),
  };
}

export default function OrgSettingsPage() {
  const { data: user, isLoading, isError } = useCurrentUser();
  const updateProfile = useUpdateProfile();

  // Profile form state — initialised from API data
  const [name,        setName]        = useState("");
  const [phone,       setPhone]       = useState<PhoneValue>(DEFAULT_PHONE);
  const [imageUrl,    setImageUrl]    = useState("");
  const [imgUploading, setImgUploading] = useState(false);

  // Sync form when user data loads
  useEffect(() => {
    if (user) {
      setName(user.name ?? "");
      setPhone(parsePhone(user.phone));
      setImageUrl(user.image ?? "");
    }
  }, [user]);

  // Other UI state
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [notif, setNotif] = useState<Notif>({
    booking: true,
    fraud: true,
    daily: false,
  });
  const [delModal, setDelModal] = useState(false);
  const [delConfirm, setDelConfirm] = useState("");
  const [saveToast, setSaveToast] = useState(false);

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync({
        name:  name.trim()                     || undefined,
        phone: `${phone.dial}${phone.num}`     || undefined,
        image: imageUrl.trim()                 || undefined,
      });
      setSaveToast(true);
      setTimeout(() => setSaveToast(false), 2000);
    } catch {
      // Error shown via updateProfile.isError
    }
  };

  const handleCopy = () => {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(API_KEY).catch(() => {});
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  const toggleNotif = (k: keyof Notif) =>
    setNotif((n) => ({ ...n, [k]: !n[k] }));

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col min-h-full">
        <OrgTopbar crumb="Settings" />
        <div className="px-6 pt-5 pb-10 max-w-[820px]">
          <div className="h-8 w-32 skeleton rounded mb-1" />
          <div className="h-4 w-64 skeleton rounded mb-6" />
          <SkeletonCard className="h-48 mb-5" />
          <SkeletonCard className="h-40" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <OrgTopbar crumb="Settings" />

      <div className="px-6 pt-5 pb-10">
        <h1 className="font-display font-bold text-[26px] text-text mb-0.5">
          Settings
        </h1>
        <p className="text-sm text-text-secondary mb-6">
          Manage your profile, integrations, and alerts.
        </p>

        {isError && (
          <AlertBanner
            tone="danger"
            title="Could not load profile"
            message="Your profile could not be loaded. Fields are empty."
            className="mb-5"
          />
        )}

        <div className="flex flex-col gap-5 max-w-[820px]">
          {/* Profile section */}
          <div className="bg-surface border border-border rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="font-display font-semibold text-[17px] text-text m-0">
                Profile
              </h2>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleSave}
                disabled={updateProfile.isPending}
                aria-label="Save profile changes"
              >
                {updateProfile.isPending ? "Saving..." : "Save changes"}
              </Button>
            </div>

            {updateProfile.isError && (
              <div className="px-6 pt-4">
                <AlertBanner
                  tone="danger"
                  title="Save failed"
                  message={updateProfile.error?.message ?? "Please try again."}
                />
              </div>
            )}

            <div className="p-6 flex flex-col gap-5">
              {/* Profile photo */}
              <div className="flex items-center gap-5">
                {/* Avatar preview */}
                <div className="relative shrink-0">
                  {imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imageUrl}
                      alt="Profile photo"
                      className="w-20 h-20 rounded-full object-cover border-2 border-border"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-brand-navy/10 text-brand-navy flex items-center justify-center text-2xl font-bold border-2 border-border select-none">
                      {initials(name || user?.name)}
                    </div>
                  )}
                  {imgUploading && (
                    <div className="absolute inset-0 rounded-full bg-white/60 flex items-center justify-center">
                      <Icon name="Loader" size={20} className="animate-spin text-brand-orange" />
                    </div>
                  )}
                </div>
                {/* Upload button */}
                <div className="flex flex-col gap-1.5">
                  <div className="text-sm font-semibold text-text">Profile photo</div>
                  <div className="text-xs text-text-muted">PNG or JPG · max 5 MB · square recommended</div>
                  <CldUploadWidget
                    uploadPreset={UPLOAD_PRESET}
                    options={{ sources: ["local", "camera"], multiple: false, maxFiles: 1, cropping: true, croppingAspectRatio: 1 }}
                    onOpen={() => setImgUploading(true)}
                    onSuccess={(result) => {
                      setImgUploading(false);
                      if (result.event !== "success") return;
                      const info = result.info as CloudinaryResult;
                      setImageUrl(info.secure_url);
                    }}
                    onError={() => setImgUploading(false)}
                  >
                    {({ open }) => (
                      <button
                        type="button"
                        onClick={() => open()}
                        disabled={imgUploading}
                        aria-label="Upload profile photo"
                        className="inline-flex items-center gap-2 h-9 px-4 rounded-md border border-border text-sm font-semibold text-text hover:border-brand-orange/40 hover:text-brand-orange transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange disabled:opacity-60"
                      >
                        <Icon name="Camera" size={15} />
                        {imgUploading ? "Uploading…" : imageUrl ? "Change photo" : "Upload photo"}
                      </button>
                    )}
                  </CldUploadWidget>
                </div>
              </div>

              {/* Name + Phone row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Name */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="set-name"
                  className="text-sm font-semibold text-text font-body"
                >
                  Name
                </label>
                <input
                  id="set-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  aria-label="Full name"
                  className="w-full h-11 px-3.5 rounded-sm border border-border bg-white text-text text-[15px] font-body focus:outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20"
                />
              </div>

              {/* Email — read-only (not in PATCH) */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="set-email"
                  className="text-sm font-semibold text-text font-body"
                >
                  Email{" "}
                  <span className="text-text-muted font-normal">
                    (contact support to change)
                  </span>
                </label>
                <input
                  id="set-email"
                  type="email"
                  readOnly
                  value={user?.email ?? ""}
                  aria-label="Email address (read-only)"
                  className="w-full h-11 px-3.5 rounded-sm border border-border bg-surface-bg text-text-muted text-[15px] font-body cursor-not-allowed"
                />
              </div>

              {/* Phone */}
              <div className="md:col-span-2">
                <div className="text-sm font-semibold text-text font-body mb-1.5">
                  Phone
                </div>
                <PhoneInput value={phone} onChange={setPhone} />
              </div>
              </div>{/* end grid */}
            </div>{/* end flex col */}
          </div>{/* end profile card */}

          {/* Notification preferences */}
          <div className="bg-surface border border-border rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="font-display font-semibold text-[17px] text-text m-0">
                Notification preferences
              </h2>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setSaveToast(true);
                  setTimeout(() => setSaveToast(false), 2000);
                }}
              >
                Save changes
              </Button>
            </div>
            <div className="divide-y divide-border">
              {(
                [
                  {
                    k: "booking",
                    title: "Booking alerts",
                    desc: "Notify me when a ticket is sold",
                  },
                  {
                    k: "fraud",
                    title: "Fraud alerts",
                    desc: "Notify me when a ticket is rejected at the gate",
                  },
                  {
                    k: "daily",
                    title: "Daily summary",
                    desc: "Send a daily sales and attendance digest",
                  },
                ] as const
              ).map(({ k, title, desc }) => (
                <div
                  key={k}
                  className="flex items-center justify-between gap-4 px-6 py-4"
                >
                  <div>
                    <div className="font-semibold text-[15px] text-text">
                      {title}
                    </div>
                    <div className="text-sm text-text-secondary mt-0.5">
                      {desc}
                    </div>
                  </div>
                  <Toggle
                    checked={notif[k]}
                    onChange={() => toggleNotif(k)}
                    label={title}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Danger zone */}
          <div className="bg-surface border border-status-danger/30 rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-status-danger/20">
              <h2 className="font-display font-semibold text-[17px] text-status-danger m-0">
                Danger zone
              </h2>
            </div>
            <div className="p-6 flex items-center justify-between gap-4">
              <div>
                <div className="font-semibold text-[15px] text-text">
                  Delete account
                </div>
                <div className="text-sm text-text-secondary mt-0.5">
                  Permanently delete your account and all event data. This
                  cannot be undone.
                </div>
              </div>
              <Button
                variant="danger"
                onClick={() => setDelModal(true)}
                className="shrink-0"
              >
                Delete account
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete account modal */}
      {delModal && (
        <Modal
          open={delModal}
          title="Delete account?"
          description="This permanently removes your account, events, and ticket data. This action cannot be undone."
          onClose={() => {
            setDelModal(false);
            setDelConfirm("");
          }}
          footer={
            <>
              <Button
                variant="ghost"
                onClick={() => {
                  setDelModal(false);
                  setDelConfirm("");
                }}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                disabled={delConfirm !== "DELETE"}
                onClick={() => setDelModal(false)}
                className="gap-2"
              >
                <Icon name="Trash2" size={15} />
                Delete account
              </Button>
            </>
          }
        >
          <div className="flex flex-col gap-3 py-2">
            <AlertBanner
              tone="danger"
              title="Irreversible action"
              message="All your events, ticket data, and gate agents will be permanently deleted."
            />
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="del-confirm"
                className="text-sm font-semibold text-text font-body"
              >
                Type{" "}
                <span className="font-mono text-status-danger">DELETE</span> to
                confirm
              </label>
              <input
                id="del-confirm"
                type="text"
                value={delConfirm}
                onChange={(e) => setDelConfirm(e.target.value)}
                placeholder="DELETE"
                aria-label="Type DELETE to confirm"
                className="w-full h-11 px-3.5 rounded-sm border border-border bg-white text-text text-[15px] font-body focus:outline-none focus:border-status-danger focus:ring-2 focus:ring-status-danger/20"
              />
            </div>
          </div>
        </Modal>
      )}

      {/* Save toast */}
      {saveToast && (
        <div
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-md bg-status-success text-white text-sm font-semibold shadow-pop"
          role="status"
          aria-live="polite"
        >
          <Icon name="Check" size={15} />
          Changes saved
        </div>
      )}
    </div>
  );
}
