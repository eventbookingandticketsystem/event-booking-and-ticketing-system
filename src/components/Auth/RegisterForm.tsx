'use client';

import { useState } from "react";
import { PhoneInput } from "@/components/Shared/PhoneInput";
import { Button } from "@/components/Shared/Button";
import { Icon } from "@/components/Shared/Icon";
import { DEFAULT_PHONE, type PhoneValue } from "@/constants/countries";
import { cn } from "@/lib/utils";

interface RegisterFormProps {
  onSuccess: () => void;
  onSignIn: () => void;
}

// Password strength: copied exactly from auth.jsx Register → pwScore logic
function calcPwScore(pw: string): 0 | 1 | 2 | 3 {
  if (pw.length === 0) return 0;
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw) || /[^A-Za-z0-9]/.test(pw)) s++;
  return s as 0 | 1 | 2 | 3;
}

const PW_LABEL  = ["", "Weak",    "Fair",    "Strong"  ] as const;
const PW_COLOR  = ["", "#A32D2D", "#7A4A00", "#1A6B3C" ] as const;
const PW_BG     = ["", "bg-status-danger", "bg-status-warning", "bg-status-success"] as const;

export function RegisterForm({ onSuccess, onSignIn }: RegisterFormProps) {
  const [name, setName]       = useState("");
  const [phone, setPhone]     = useState<PhoneValue>(DEFAULT_PHONE);
  const [pw, setPw]           = useState("");
  const [confirm, setConfirm] = useState("");
  const [role, setRole]       = useState<"attendee" | "organizer">("attendee");
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState(false);

  const pwScore = calcPwScore(pw);

  const errors = {
    name: !name.trim()
      ? "Full name is required"
      : name.trim().length < 2
      ? "At least 2 characters"
      : "",
    phone: !phone.num
      ? "Phone number is required"
      : phone.num.length < 7
      ? "Enter a valid phone number"
      : "",
    pw: !pw
      ? "Password is required"
      : pw.length < 8
      ? "At least 8 characters"
      : "",
    confirm: !confirm
      ? "Confirm your password"
      : confirm !== pw
      ? "Passwords do not match"
      : "",
  };
  const isValid  = !Object.values(errors).some(Boolean);
  const fieldErr = (k: keyof typeof errors) => (touched ? errors[k] : "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!isValid) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onSuccess();
    }, 1100);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-[410px] bg-surface border border-border rounded-lg shadow-card p-[38px] flex flex-col gap-5"
      noValidate
    >
      {/* Heading */}
      <div className="flex flex-col gap-1">
        <h2 className="font-display font-bold text-2xl text-text m-0">
          Create your account
        </h2>
        <p className="text-[15px] text-text-secondary m-0">
          Join Tiketi to book and manage events.
        </p>
      </div>

      {/* Full name */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="reg-name" className="text-sm font-semibold text-text font-body">
          Full name
        </label>
        <input
          id="reg-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Achol Deng"
          disabled={loading}
          aria-label="Full name"
          aria-invalid={!!fieldErr("name")}
          aria-describedby={fieldErr("name") ? "reg-name-error" : undefined}
          className={cn(
            "w-full h-11 px-3.5 rounded-sm border bg-white text-text text-[15px] font-body transition-colors",
            "placeholder:text-text-muted focus:outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 disabled:opacity-60",
            fieldErr("name") ? "border-status-danger" : "border-border",
          )}
        />
        {fieldErr("name") && (
          <p id="reg-name-error" role="alert" className="text-xs text-status-danger font-semibold">
            {fieldErr("name")}
          </p>
        )}
      </div>

      {/* Phone */}
      <PhoneInput
        value={phone}
        onChange={setPhone}
        disabled={loading}
        error={fieldErr("phone")}
      />

      {/* Password + strength meter */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="reg-pw" className="text-sm font-semibold text-text font-body">
          Password
        </label>
        <div
          className={cn(
            "flex items-stretch h-11 border rounded-sm bg-white transition-colors",
            fieldErr("pw")
              ? "border-status-danger"
              : "border-border focus-within:border-brand-orange focus-within:ring-2 focus-within:ring-brand-orange/20",
          )}
        >
          <input
            id="reg-pw"
            type={showPw ? "text" : "password"}
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="Create a password"
            disabled={loading}
            aria-label="Password"
            aria-invalid={!!fieldErr("pw")}
            aria-describedby={fieldErr("pw") ? "reg-pw-error" : undefined}
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
        {fieldErr("pw") && (
          <p id="reg-pw-error" role="alert" className="text-xs text-status-danger font-semibold">
            {fieldErr("pw")}
          </p>
        )}

        {/* Strength meter — only shown when pw has content */}
        {pw && (
          <div className="-mt-1">
            {/* 3-segment bar */}
            <div className="flex gap-[5px] mt-2" role="meter" aria-label={`Password strength: ${PW_LABEL[pwScore]}`} aria-valuenow={pwScore} aria-valuemin={0} aria-valuemax={3}>
              {([1, 2, 3] as const).map((i) => (
                <span
                  key={i}
                  className={cn(
                    "flex-1 h-[5px] rounded-pill transition-colors duration-200",
                    i <= pwScore ? PW_BG[pwScore] : "bg-border",
                  )}
                />
              ))}
            </div>
            {/* Strength label */}
            <p
              className="text-xs font-semibold mt-1.5"
              style={{ color: PW_COLOR[pwScore] }}
            >
              {PW_LABEL[pwScore]} password
            </p>
          </div>
        )}
      </div>

      {/* Confirm password */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="reg-confirm" className="text-sm font-semibold text-text font-body">
          Confirm password
        </label>
        <input
          id="reg-confirm"
          type={showPw ? "text" : "password"}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Re-enter password"
          disabled={loading}
          aria-label="Confirm password"
          aria-invalid={!!fieldErr("confirm")}
          aria-describedby={fieldErr("confirm") ? "reg-confirm-error" : undefined}
          className={cn(
            "w-full h-11 px-3.5 rounded-sm border bg-white text-text text-[15px] font-body transition-colors",
            "placeholder:text-text-muted focus:outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 disabled:opacity-60",
            fieldErr("confirm") ? "border-status-danger" : "border-border",
          )}
        />
        {fieldErr("confirm") && (
          <p id="reg-confirm-error" role="alert" className="text-xs text-status-danger font-semibold">
            {fieldErr("confirm")}
          </p>
        )}
      </div>

      {/* Role toggle */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-text font-body">
          I am registering as
        </label>
        <div
          className="flex gap-2"
          role="radiogroup"
          aria-label="Account role"
        >
          {(["attendee", "organizer"] as const).map((r) => (
            <button
              key={r}
              type="button"
              role="radio"
              aria-checked={role === r}
              onClick={() => setRole(r)}
              disabled={loading}
              className={cn(
                "flex-1 inline-flex items-center justify-center gap-2 h-11 rounded-md border text-sm font-semibold font-body transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange",
                role === r
                  ? "bg-brand-orange border-brand-orange text-white"
                  : "bg-surface-bg border-border text-text hover:border-brand-orange/50",
              )}
            >
              <Icon name={r === "attendee" ? "Smartphone" : "LayoutDashboard"} size={16} />
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>
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
        {loading ? "Creating account…" : (
          <>
            Create account
            <Icon name="ArrowRight" size={18} />
          </>
        )}
      </Button>

      {/* Sign in link */}
      <div className="text-center text-sm text-text-secondary">
        Already have an account?{" "}
        <button
          type="button"
          onClick={onSignIn}
          className="font-semibold text-brand-orange hover:text-brand-orange-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange rounded"
        >
          Sign in
        </button>
      </div>
    </form>
  );
}
