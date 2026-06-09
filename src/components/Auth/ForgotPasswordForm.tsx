'use client';

import { useState } from "react";
import { PhoneInput } from "@/components/Shared/PhoneInput";
import { Button } from "@/components/Shared/Button";
import { AlertBanner } from "@/components/Shared/AlertBanner";
import { Icon } from "@/components/Shared/Icon";
import { DEFAULT_PHONE, type PhoneValue, phoneE164 } from "@/constants/countries";

interface ForgotPasswordFormProps {
  onSignIn: () => void;
}

export function ForgotPasswordForm({ onSignIn }: ForgotPasswordFormProps) {
  const [phone, setPhone]   = useState<PhoneValue>(DEFAULT_PHONE);
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState(false);
  const [sent, setSent]       = useState(false);

  const phoneErr = !phone.num
    ? "Phone number is required"
    : phone.num.length < 7
    ? "Enter a valid phone number"
    : "";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (phoneErr) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSent(true);
    }, 1000);
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
          Reset password
        </h2>
        <p className="text-[15px] text-text-secondary m-0">
          We&apos;ll text a reset code to your number.
        </p>
      </div>

      {sent ? (
        <>
          <AlertBanner
            tone="success"
            title="Reset code sent"
            message={`A reset code has been sent to ${phoneE164(phone)}. Enter it on the next screen to set a new password.`}
          />
          <Button
            type="button"
            variant="ghost"
            size="lg"
            fullWidth
            onClick={onSignIn}
            className="gap-2"
          >
            <Icon name="ArrowLeft" size={18} />
            Back to sign in
          </Button>
        </>
      ) : (
        <>
          <PhoneInput
            value={phone}
            onChange={setPhone}
            disabled={loading}
            error={touched ? phoneErr : ""}
          />

          <Button
            type="submit"
            size="lg"
            fullWidth
            loading={loading}
            disabled={loading}
            className="gap-2"
          >
            {loading ? "Sending…" : (
              <>
                Send reset code
                <Icon name="ArrowRight" size={18} />
              </>
            )}
          </Button>

          <div className="text-center text-sm text-text-secondary">
            <button
              type="button"
              onClick={onSignIn}
              className="font-semibold text-brand-orange hover:text-brand-orange-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange rounded"
            >
              Back to sign in
            </button>
          </div>
        </>
      )}
    </form>
  );
}
