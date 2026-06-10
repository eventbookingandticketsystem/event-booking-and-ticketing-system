'use client';

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthLayout } from "@/components/Auth/AuthLayout";
import { LoginForm } from "@/components/Auth/LoginForm";
import { Icon } from "@/components/Shared/Icon";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";
import { type icons } from "lucide-react";

// ── Role picker modal ─────────────────────────────────────────────────────────

interface RoleOption {
  id: string;
  label: string;
  description: string;
  icon: keyof typeof icons;
  route: string;
  iconBg: string;
  iconFg: string;
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    id: "attendee",
    label: "Attendee",
    description: "Browse events and manage your tickets",
    icon: "User",
    route: ROUTES.DASHBOARD,
    iconBg: "bg-brand-orange/10",
    iconFg: "text-brand-orange",
  },
  {
    id: "organizer",
    label: "Organizer",
    description: "Manage your events and gate agents",
    icon: "LayoutDashboard",
    route: ROUTES.ORGANIZER,
    iconBg: "bg-brand-navy/8",
    iconFg: "text-brand-navy",
  },
  {
    id: "agent",
    label: "Gate Agent",
    description: "Scan tickets and validate entry",
    icon: "ScanLine",
    route: ROUTES.AGENT,
    iconBg: "bg-status-success/10",
    iconFg: "text-status-success",
  },
  {
    id: "admin",
    label: "Admin",
    description: "Platform oversight and system settings",
    icon: "ShieldCheck",
    route: ROUTES.ADMIN,
    iconBg: "bg-status-danger/10",
    iconFg: "text-status-danger",
  },
];

function RolePickerModal({
  open,
  onPick,
}: {
  open: boolean;
  onPick: (route: string) => void;
}) {
  const [hovered, setHovered] = useState<string | null>(null);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Choose your dashboard"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-brand-navy/50 backdrop-blur-sm"
        aria-hidden="true"
      />

      {/* Dialog */}
      <div className="relative w-full max-w-md bg-surface rounded-lg shadow-pop overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-center gap-3 mb-1">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-md bg-brand-orange shrink-0">
              <Icon name="Ticket" size={18} className="text-white" />
            </span>
            <h2 className="font-display font-bold text-[20px] text-text leading-none">
              Welcome back
            </h2>
          </div>
          <p className="text-sm text-text-secondary mt-2">
            You&apos;re signed in. Choose which dashboard to open.
          </p>
        </div>

        {/* Role options */}
        <div className="px-4 py-4 flex flex-col gap-2">
          {ROLE_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => onPick(opt.route)}
              onMouseEnter={() => setHovered(opt.id)}
              onMouseLeave={() => setHovered(null)}
              aria-label={`Continue as ${opt.label}`}
              className={cn(
                "flex items-center gap-4 w-full px-4 py-3.5 rounded-lg border text-left transition-all duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange",
                hovered === opt.id
                  ? "border-brand-orange bg-surface-alt shadow-card"
                  : "border-border bg-surface hover:border-brand-orange/40 hover:bg-surface-alt",
              )}
            >
              {/* Icon */}
              <span
                className={cn(
                  "inline-flex items-center justify-center w-10 h-10 rounded-md shrink-0",
                  opt.iconBg,
                )}
              >
                <Icon name={opt.icon} size={20} className={opt.iconFg} />
              </span>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <div className="font-display font-semibold text-[15px] text-text">
                  {opt.label}
                </div>
                <div className="text-[13px] text-text-secondary mt-0.5 leading-snug">
                  {opt.description}
                </div>
              </div>

              {/* Arrow */}
              <Icon
                name="ChevronRight"
                size={17}
                className={cn(
                  "shrink-0 transition-colors",
                  hovered === opt.id ? "text-brand-orange" : "text-text-muted",
                )}
              />
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 pt-1 text-center">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium tracking-[1.1px] uppercase text-text-muted/55">
            <Icon name="Shield" size={12} />
            Secure 256-bit encrypted session
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Login page ────────────────────────────────────────────────────────────────

function LoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bannerParam = searchParams.get("banner");
  const [showRolePicker, setShowRolePicker] = useState(false);

  // Determine pre-set banner from URL
  let banner: { tone: "success" | "info"; message: string } | null = null;
  if (bannerParam === "booking") {
    banner = { tone: "info", message: "Sign in to complete your booking." };
  } else if (bannerParam === "registered") {
    banner = { tone: "success", message: "Account created. Sign in to continue." };
  }

  return (
    <>
      <AuthLayout>
        <LoginForm
          onSuccess={() => setShowRolePicker(true)}
          onRegister={() => router.push(ROUTES.REGISTER)}
          onForgot={() => router.push(ROUTES.FORGOT_PASSWORD)}
          banner={banner}
        />
      </AuthLayout>

      <RolePickerModal
        open={showRolePicker}
        onPick={(route) => router.push(route)}
      />
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen grid grid-cols-1 md:grid-cols-[45%_1fr]">
          <div className="hidden md:block bg-brand-navy" />
          <div className="flex items-center justify-center bg-surface-bg">
            <div className="w-[410px] h-[480px] skeleton rounded-lg" />
          </div>
        </div>
      }
    >
      <LoginInner />
    </Suspense>
  );
}
