'use client';

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { PhoneInput } from "@/components/Shared/PhoneInput";
import { Button } from "@/components/Shared/Button";
import { AlertBanner } from "@/components/Shared/AlertBanner";
import { Icon } from "@/components/Shared/Icon";
import { DEFAULT_PHONE, type PhoneValue } from "@/constants/countries";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";

interface LoginFormProps {
  onRegister: () => void;
  onForgot:   () => void;
  /** Optional pre-set banner from URL param (booking redirect, registered, etc.) */
  banner?: { tone: "success" | "danger" | "warning" | "info"; message: string } | null;
}

// Map DB role string → destination route
function roleRoute(role: unknown): string {
  switch (role) {
    case "ORGANIZER":  return ROUTES.ORGANIZER;
    case "GATE_AGENT": return ROUTES.AGENT;
    case "ADMIN":      return ROUTES.ADMIN;
    default:           return ROUTES.DASHBOARD;  // ATTENDEE + fallback
  }
}

export function LoginForm({ onRegister, onForgot, banner }: LoginFormProps) {
  const router = useRouter();

  const [phone, setPhone]   = useState<PhoneValue>(DEFAULT_PHONE);
  const [pw, setPw]         = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Inline validation
  const errors = {
    phone: !phone.num
      ? "Phone number is required"
      : phone.num.length < 7
      ? "Enter a valid phone number"
      : "",
    pw: !pw
      ? "Password is required"
      : pw.length < 6
      ? "At least 6 characters"
      : "",
  };
  const isValid = !errors.phone && !errors.pw;
  const fieldError = (k: keyof typeof errors) => (touched ? errors[k] : "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!isValid) return;

    setLoading(true);
    setAuthError(null);

    // Combine dial code + local number: "+211" + "912000001" → "+211912000001"
    const fullPhone = phone.dial + phone.num;

    const result = await signIn("credentials", {
      phone:    fullPhone,
      password: pw,
      redirect: false,   // handle redirect ourselves so we can read the role
    });

    if (!result?.ok || result.error) {
      // Never expose which field was wrong — generic message per spec
      setAuthError("Invalid credentials. Check your details and try again.");
      setLoading(false);
      return;
    }

    // Fetch the session to read the role for role-based redirect.
    // getSession() from next-auth/react returns the session after signIn.
    const { getSession } = await import("next-auth/react");
    const session = await getSession();
    const role = (session?.user as Record<string, unknown> | undefined)?.role;

    router.push(roleRoute(role));
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-[410px] bg-surface border border-border rounded-lg shadow-card p-[38px] flex flex-col gap-5"
      noValidate
    >
      {/* Card heading */}
      <div className="flex flex-col gap-1">
        <h2 className="font-display font-bold text-2xl text-text m-0">Sign in</h2>
        <p className="text-[15px] text-text-secondary m-0">
          Welcome back. Enter your details to continue.
        </p>
      </div>

      {/* Banner from URL param (booking redirect, registration success, etc.) */}
      {banner && <AlertBanner tone={banner.tone} message={banner.message} />}

      {/* Auth error — shown only after a failed signIn attempt */}
      {authError && (
        <AlertBanner
          tone="danger"
          title="Sign-in failed"
          message={authError}
        />
      )}

      {/* Phone */}
      <PhoneInput
        value={phone}
        onChange={setPhone}
        disabled={loading}
        error={fieldError("phone")}
      />

      {/* Password */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="login-pw" className="text-sm font-semibold text-text font-body">
          Password
        </label>
        <div
          className={cn(
            "flex items-stretch h-11 border rounded-sm bg-white transition-colors",
            fieldError("pw")
              ? "border-status-danger"
              : "border-border focus-within:border-brand-orange focus-within:ring-2 focus-within:ring-brand-orange/20",
          )}
        >
          <input
            id="login-pw"
            type={showPw ? "text" : "password"}
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="Enter your password"
            disabled={loading}
            aria-label="Password"
            aria-invalid={!!fieldError("pw")}
            aria-describedby={fieldError("pw") ? "login-pw-error" : undefined}
            className="flex-1 border-none outline-none bg-transparent px-3.5 text-[15px] text-text font-body placeholder:text-text-muted min-w-0 disabled:opacity-60"
          />
          <button
            type="button"
            onClick={() => setShowPw((s) => !s)}
            aria-label={showPw ? "Hide password" : "Show password"}
            className="px-3 text-text-muted hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange rounded-r-sm"
          >
            <Icon name={showPw ? "EyeOff" : "Eye"} size={18} />
          </button>
        </div>
        {fieldError("pw") && (
          <p id="login-pw-error" role="alert" className="text-xs text-status-danger font-semibold">
            {fieldError("pw")}
          </p>
        )}
      </div>

      {/* Forgot password link */}
      <div className="flex justify-end -mt-2">
        <button
          type="button"
          onClick={onForgot}
          className="text-sm font-semibold text-brand-orange hover:text-brand-orange-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange rounded"
        >
          Forgot password?
        </button>
      </div>

      {/* Submit */}
      <Button
        type="submit"
        size="lg"
        fullWidth
        loading={loading}
        disabled={loading}
        className="gap-2"
      >
        {loading ? "Signing in…" : (
          <>
            Sign in
            <Icon name="ArrowRight" size={18} />
          </>
        )}
      </Button>

      {/* Divider */}
      <div className="flex items-center gap-3.5 text-[13px] text-text-secondary">
        <span className="flex-1 h-px bg-border" />
        New to Tiketi?
        <span className="flex-1 h-px bg-border" />
      </div>

      {/* Register CTA */}
      <Button type="button" variant="ghost" fullWidth onClick={onRegister}>
        Create an account
      </Button>

      {/* Secure footer */}
      <div className="text-center">
        <span className="inline-flex items-center gap-2 text-[11px] font-medium tracking-[1.1px] uppercase text-text-muted/55">
          <Icon name="Shield" size={13} />
          Secure 256-bit encrypted session
        </span>
      </div>
    </form>
  );
}
