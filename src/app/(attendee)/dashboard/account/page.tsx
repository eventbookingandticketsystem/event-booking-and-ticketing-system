'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { CldUploadWidget } from "next-cloudinary";
import { Icon } from "@/components/Shared/Icon";
import { Button } from "@/components/Shared/Button";
import { AlertBanner } from "@/components/Shared/AlertBanner";
import { PhoneInput } from "@/components/Shared/PhoneInput";
import { useCurrentUser, useUpdateProfile } from "@/lib/api/hooks/useCurrentUser";
import { PHONE_COUNTRIES, type PhoneValue } from "@/constants/countries";
import apiClient from "@/lib/api/client";
import { cn } from "@/lib/utils";

const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? "tiketi_events";

// ── helpers ──────────────────────────────────────────────────────────────────
function initials(name: string) {
  return name.split(" ").map((w) => w[0] ?? "").join("").slice(0, 2).toUpperCase() || "?";
}

/**
 * Parse a stored E.164 phone string like "+211929468146" into a PhoneValue.
 * Tries to match against every country's dial code (longest match first).
 * Returns null if the string is empty or doesn't start with "+".
 */
function parsePhoneString(raw: string | null | undefined): PhoneValue | null {
  if (!raw || !raw.startsWith("+")) return null;
  // Sort by dial length descending so "+1-876" matches before "+1"
  const sorted = [...PHONE_COUNTRIES].sort((a, b) => b.dial.length - a.dial.length);
  for (const country of sorted) {
    if (raw.startsWith(country.dial)) {
      return {
        dial: country.dial,
        code: country.code,
        num:  raw.slice(country.dial.length),
      };
    }
  }
  // Couldn't match — put everything in `num` with default SS code
  return { dial: "+211", code: "SS", num: raw.replace(/^\+\d+/, "") };
}

// ── Section wrapper ───────────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h2 className="font-display font-semibold text-[13px] uppercase tracking-[1px] text-text-muted mb-2 px-1">
        {title}
      </h2>
      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        {children}
      </div>
    </div>
  );
}

// ── Field row ─────────────────────────────────────────────────────────────────
function FieldRow({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) {
  return (
    <div className="px-4 py-3 border-b border-border/50 last:border-b-0">
      <label className="block text-[11px] font-semibold uppercase tracking-[0.8px] text-text-muted mb-1.5">
        {label}
      </label>
      {children}
      {error && <p className="text-xs text-status-danger font-semibold mt-1">{error}</p>}
    </div>
  );
}

const inputCls = (hasError?: boolean) =>
  cn(
    "w-full h-10 px-3 rounded-sm border text-[15px] text-text bg-surface-bg font-body outline-none transition-colors",
    "focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    hasError ? "border-status-danger" : "border-border",
  );

const pwRowCls = (hasError?: boolean) =>
  cn(
    "flex items-stretch h-10 border rounded-sm bg-surface-bg transition-colors",
    "focus-within:border-brand-orange focus-within:ring-2 focus-within:ring-brand-orange/20",
    hasError ? "border-status-danger" : "border-border",
  );

// ─────────────────────────────────────────────────────────────────────────────

export default function AccountPage() {
  const router = useRouter();
  const { update: updateSession } = useSession(); // used to trigger a session re-fetch after save
  const { data: user, isLoading } = useCurrentUser();
  const updateProfile = useUpdateProfile();

  // ── Profile state — always empty until API loads ──────────────────────────
  const [name, setName]         = useState("");
  const [phone, setPhone]       = useState<PhoneValue>({ dial: "+211", code: "SS", num: "" });
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [profileMsg, setProfileMsg] = useState<{ tone: "success" | "danger"; text: string } | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);

  // ── Password state — never pre-filled ────────────────────────────────────
  const [currentPw, setCurrentPw]     = useState("");
  const [newPw, setNewPw]             = useState("");
  const [confirmPw, setConfirmPw]     = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwMsg, setPwMsg]     = useState<{ tone: "success" | "danger"; text: string } | null>(null);
  const [pwSaving, setPwSaving] = useState(false);

  // ── Seed from API (only when data first arrives) ──────────────────────────
  useEffect(() => {
    if (!user) return;
    setName(user.name ?? "");
    // Use whatever image is stored (Google OAuth photo or custom upload)
    setImageUrl(user.image ?? null);

    // Parse stored phone string → PhoneValue; leave empty if not set
    const parsed = parsePhoneString(user.phone);
    if (parsed) {
      setPhone(parsed);
    } else {
      setPhone({ dial: "+211", code: "SS", num: "" });
    }
  }, [user]);

  // ── Profile validation ────────────────────────────────────────────────────
  const nameErr  = name.trim().length > 0 && name.trim().length < 2 ? "At least 2 characters" : "";
  const phoneErr = phone.num.length > 0 && phone.num.length < 7 ? "Enter a valid phone number" : "";

  // ── Save profile + update session ─────────────────────────────────────────
  const handleSaveProfile = async () => {
    if (nameErr || phoneErr) return;
    setProfileSaving(true);
    setProfileMsg(null);
    try {
      const fullPhone = phone.num ? phone.dial + phone.num : undefined;
      await updateProfile.mutateAsync({
        name:  name.trim()  || undefined,
        phone: fullPhone,
        image: imageUrl     ?? undefined,
      });

      // Trigger a session re-fetch — the session callback now reads fresh
      // name/image/phone directly from DB, so the topbar updates immediately.
      await updateSession();

      setProfileMsg({ tone: "success", text: "Profile updated successfully." });
    } catch {
      setProfileMsg({ tone: "danger", text: "Failed to save profile. Please try again." });
    } finally {
      setProfileSaving(false);
    }
  };

  // ── Password validation ───────────────────────────────────────────────────
  const newPwErr     = newPw     && newPw.length < 8       ? "At least 8 characters"    : "";
  const confirmPwErr = confirmPw && confirmPw !== newPw     ? "Passwords do not match"   : "";
  const pwFormValid  = currentPw.length >= 1 && newPw.length >= 8 && confirmPw === newPw;

  // ── Strength ──────────────────────────────────────────────────────────────
  const pwStrength: 0 | 1 | 2 =
    newPw.length === 0 ? 0
    : newPw.length < 8  ? 0
    : /[^a-zA-Z0-9]/.test(newPw) && newPw.length >= 10 ? 2
    : 1;
  const strengthLabel = ["", "Weak", "Fair", "Strong"][newPw.length === 0 ? 0 : pwStrength + 1];
  const strengthColor = ["", "bg-status-danger", "bg-status-warning", "bg-status-success"][newPw.length === 0 ? 0 : pwStrength + 1];

  // ── Save password ─────────────────────────────────────────────────────────
  const handleSavePassword = async () => {
    if (!pwFormValid) return;
    setPwSaving(true);
    setPwMsg(null);
    try {
      await apiClient.patch("/auth/me/password", {
        currentPassword: currentPw,
        newPassword:     newPw,
      });
      setPwMsg({ tone: "success", text: "Password changed successfully." });
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? "Failed to change password. Check your current password and try again.";
      setPwMsg({ tone: "danger", text: msg });
    } finally {
      setPwSaving(false);
    }
  };

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="w-full max-w-xl mx-auto px-4 pt-6 pb-8">
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-24 h-24 rounded-full skeleton" />
          <div className="h-4 w-40 skeleton rounded" />
        </div>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-14 skeleton rounded-lg mb-4" />
        ))}
      </div>
    );
  }

  const displayName    = user?.name ?? "";
  const avatarInitials = displayName ? initials(displayName) : "?";

  return (
    <div className="flex flex-col min-h-full">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-[18px] pt-4 pb-3 bg-surface border-b border-border shrink-0">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Go back"
          className="text-text-muted hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange rounded"
        >
          <Icon name="ArrowLeft" size={20} />
        </button>
        <h1 className="font-display font-semibold text-[20px] text-text flex-1 m-0">
          Account settings
        </h1>
      </div>

      <div className="w-full max-w-xl mx-auto px-4 pt-6 pb-24">

        {/* ── Avatar ─────────────────────────────────────────────────────── */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="relative">
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt={displayName || "Profile photo"}
                className="w-24 h-24 rounded-full object-cover border-2 border-border"
              />
            ) : (
              <div
                className="w-24 h-24 rounded-full bg-brand-navy text-white inline-flex items-center justify-center font-display font-bold text-[28px] border-2 border-border"
                aria-label="User avatar"
              >
                {avatarInitials}
              </div>
            )}

            {/* Camera badge */}
            <CldUploadWidget
              uploadPreset={UPLOAD_PRESET}
              options={{
                maxFiles: 1,
                resourceType: "image",
                cropping: true,
                croppingAspectRatio: 1,
              }}
              onSuccess={(result) => {
                const info = result.info as { secure_url?: string } | undefined;
                if (info?.secure_url) setImageUrl(info.secure_url);
              }}
            >
              {({ open }) => (
                <button
                  type="button"
                  onClick={() => open()}
                  aria-label="Upload profile photo"
                  className={cn(
                    "absolute bottom-0 right-0 w-8 h-8 rounded-full",
                    "bg-brand-orange hover:bg-brand-orange-hover text-white",
                    "flex items-center justify-center shadow-pop transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange",
                  )}
                >
                  <Icon name="Camera" size={15} />
                </button>
              )}
            </CldUploadWidget>
          </div>
          <p className="text-[13px] text-text-muted">Tap the camera icon to update your photo</p>
        </div>

        {/* ── Personal information ───────────────────────────────────────── */}
        <Section title="Personal information">
          {profileMsg && (
            <div className="px-4 pt-3">
              <AlertBanner tone={profileMsg.tone} message={profileMsg.text} />
            </div>
          )}

          <FieldRow label="Full name" error={nameErr}>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              aria-label="Full name"
              className={inputCls(!!nameErr)}
            />
          </FieldRow>

          {/* Phone — full PhoneInput component with country selector */}
          <div className="px-4 py-3 border-b border-border/50">
            <PhoneInput
              label="Phone number"
              value={phone}
              onChange={setPhone}
              error={phoneErr}
            />
          </div>

          {/* Email — read-only */}
          {user?.email && (
            <FieldRow label="Email address">
              <input
                type="email"
                value={user.email}
                disabled
                aria-label="Email address (read-only)"
                className={inputCls()}
              />
              <p className="text-[11px] text-text-muted mt-1">Email cannot be changed here.</p>
            </FieldRow>
          )}

          <div className="px-4 py-3">
            <Button
              size="md"
              fullWidth
              onClick={handleSaveProfile}
              loading={profileSaving}
              disabled={profileSaving || !!nameErr || !!phoneErr}
              aria-label="Save profile changes"
              className="gap-2"
            >
              <Icon name="Save" size={16} />
              Save changes
            </Button>
          </div>
        </Section>

        {/* ── Change password ────────────────────────────────────────────── */}
        <Section title="Change password">
          {pwMsg && (
            <div className="px-4 pt-3">
              <AlertBanner tone={pwMsg.tone} message={pwMsg.text} />
            </div>
          )}

          {/* Current password — never pre-filled, autocomplete off */}
          <FieldRow label="Current password">
            <div className={pwRowCls()}>
              <input
                type={showCurrent ? "text" : "password"}
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                placeholder="Enter current password"
                aria-label="Current password"
                autoComplete="current-password"
                className="flex-1 border-none outline-none bg-transparent px-3 text-[15px] text-text font-body placeholder:text-text-muted min-w-0"
              />
              <button
                type="button"
                onClick={() => setShowCurrent((s) => !s)}
                aria-label={showCurrent ? "Hide current password" : "Show current password"}
                className="px-3 text-text-muted hover:text-text"
              >
                <Icon name={showCurrent ? "EyeOff" : "Eye"} size={16} />
              </button>
            </div>
          </FieldRow>

          {/* New password */}
          <FieldRow label="New password" error={newPwErr}>
            <div className={pwRowCls(!!newPwErr)}>
              <input
                type={showNew ? "text" : "password"}
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                placeholder="Min. 8 characters"
                aria-label="New password"
                autoComplete="new-password"
                className="flex-1 border-none outline-none bg-transparent px-3 text-[15px] text-text font-body placeholder:text-text-muted min-w-0"
              />
              <button
                type="button"
                onClick={() => setShowNew((s) => !s)}
                aria-label={showNew ? "Hide new password" : "Show new password"}
                className="px-3 text-text-muted hover:text-text"
              >
                <Icon name={showNew ? "EyeOff" : "Eye"} size={16} />
              </button>
            </div>
            {/* Strength meter */}
            {newPw.length > 0 && (
              <div className="mt-2 flex items-center gap-1.5">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex-1 h-1 rounded-full transition-colors",
                      i <= pwStrength ? strengthColor : "bg-border",
                    )}
                  />
                ))}
                <span className="text-[11px] text-text-muted ml-1 w-10">{strengthLabel}</span>
              </div>
            )}
          </FieldRow>

          {/* Confirm new password */}
          <FieldRow label="Confirm new password" error={confirmPwErr}>
            <div className={pwRowCls(!!confirmPwErr)}>
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                placeholder="Re-enter new password"
                aria-label="Confirm new password"
                autoComplete="new-password"
                className="flex-1 border-none outline-none bg-transparent px-3 text-[15px] text-text font-body placeholder:text-text-muted min-w-0"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((s) => !s)}
                aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
                className="px-3 text-text-muted hover:text-text"
              >
                <Icon name={showConfirm ? "EyeOff" : "Eye"} size={16} />
              </button>
            </div>
          </FieldRow>

          <div className="px-4 py-3">
            <Button
              size="md"
              fullWidth
              onClick={handleSavePassword}
              loading={pwSaving}
              disabled={pwSaving || !pwFormValid}
              aria-label="Change password"
              className="gap-2"
            >
              <Icon name="Lock" size={16} />
              Change password
            </Button>
          </div>
        </Section>

        {/* ── Account actions ────────────────────────────────────────────── */}
        <Section title="Account">
          <button
            type="button"
            onClick={() => signOut({ redirect: true, callbackUrl: "/login" })}
            aria-label="Sign out"
            className={cn(
              "flex items-center gap-3.5 w-full px-4 py-4 text-left min-h-[56px] transition-colors",
              "hover:bg-status-danger-bg text-status-danger",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-status-danger",
            )}
          >
            <Icon name="LogOut" size={19} className="shrink-0" />
            <span className="flex-1 font-medium text-[15px]">Sign out</span>
          </button>
        </Section>

      </div>
    </div>
  );
}
