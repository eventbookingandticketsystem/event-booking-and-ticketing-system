'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Shared/Icon";
import { cn } from "@/lib/utils";

const CAT_OPTIONS = [
  { value: "General", label: "General Admission", price: 14 },
  { value: "VIP",     label: "VIP",               price: 35 },
  { value: "Student", label: "Student",            price: 7  },
] as const;

type CatValue = (typeof CAT_OPTIONS)[number]["value"];

function formatUSD(n: number): string {
  return `$${n.toLocaleString("en-US")}`;
}

export default function CashEntryPage() {
  const router = useRouter();

  const [name,     setName]     = useState("");
  const [cat,      setCat]      = useState<CatValue>("General");
  const [amount,   setAmount]   = useState("");
  const [touched,  setTouched]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [success,  setSuccess]  = useState(false);

  const catObj      = CAT_OPTIONS.find((c) => c.value === cat)!;
  const expectedPrice = catObj.price;

  const nameErr = !name.trim()
    ? "Attendee name is required"
    : name.trim().length < 2
    ? "At least 2 characters"
    : "";

  const amountWarn =
    amount !== "" && Number(amount) !== expectedPrice
      ? `Expected ${formatUSD(expectedPrice)} for ${catObj.label}`
      : "";

  const isValid = !nameErr && !!cat;

  const handleRecord = () => {
    setTouched(true);
    if (!isValid) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
    }, 800);
  };

  // Auto-navigate back after success
  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => router.back(), 1200);
    return () => clearTimeout(t);
  }, [success, router]);

  // ── Success overlay ────────────────────────────────────────────────────
  if (success) {
    return (
      <div
        className="h-full flex flex-col items-center justify-center gap-4"
        style={{ background: "#1A7A4A" }}
        role="status"
        aria-live="assertive"
      >
        <Icon name="CircleCheck" size={64} strokeWidth={2.5} className="text-white" />
        <h1 className="font-display font-bold text-[48px] text-white text-center leading-none px-6">
          Entry recorded
        </h1>
        <p className="text-white/60 text-sm text-center">Redirecting to scanner…</p>
      </div>
    );
  }

  // ── Form ───────────────────────────────────────────────────────────────
  return (
    <div className="h-full bg-brand-navy flex flex-col overflow-hidden">
      {/* Section header */}
      <div className="px-5 pt-5 pb-3 shrink-0">
        <h1 className="font-display font-bold text-[20px] text-white leading-tight">
          Manual entry
        </h1>
        <p className="text-white/50 text-sm mt-0.5">
          Record attendance for a walk-in cash payment.
        </p>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto px-5 pb-8">
        <div className="flex flex-col gap-5 mt-2">

          {/* Attendee name */}
          <div className="flex flex-col gap-2">
            <label htmlFor="cash-name" className="text-[11px] font-semibold uppercase tracking-[0.8px] text-white/50">
              Attendee name
            </label>
            <input
              id="cash-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              disabled={loading}
              aria-label="Attendee name"
              aria-invalid={touched && !!nameErr}
              aria-describedby={touched && nameErr ? "cash-name-err" : undefined}
              className={cn(
                "w-full h-[52px] px-4 rounded-lg border text-white text-[15px] font-body placeholder:text-white/30 bg-white/8 transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-brand-orange disabled:opacity-60",
                touched && nameErr ? "border-[#f0a8a8]" : "border-white/12",
              )}
            />
            {touched && nameErr && (
              <p id="cash-name-err" role="alert" className="text-[12px] text-[#f0a8a8] font-semibold">
                {nameErr}
              </p>
            )}
          </div>

          {/* Ticket category */}
          <div className="flex flex-col gap-2">
            <label htmlFor="cash-cat" className="text-[11px] font-semibold uppercase tracking-[0.8px] text-white/50">
              Ticket category
            </label>
            <div className="relative">
              <select
                id="cash-cat"
                value={cat}
                onChange={(e) => setCat(e.target.value as CatValue)}
                disabled={loading}
                aria-label="Ticket category"
                className="w-full h-[52px] px-4 pr-10 rounded-lg border border-white/12 bg-white/8 text-white text-[15px] font-body appearance-none focus:outline-none focus:ring-2 focus:ring-brand-orange disabled:opacity-60"
              >
                {CAT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value} style={{ color: "#000", background: "#fff" }}>
                    {o.label} — {formatUSD(o.price)}
                  </option>
                ))}
              </select>
              <Icon
                name="ChevronDown"
                size={18}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none"
              />
            </div>
          </div>

          {/* Amount paid */}
          <div className="flex flex-col gap-2">
            <label htmlFor="cash-amount" className="text-[11px] font-semibold uppercase tracking-[0.8px] text-white/50">
              Amount paid (USD)
            </label>
            <input
              id="cash-amount"
              type="number"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder={String(expectedPrice)}
              disabled={loading}
              aria-label="Amount paid in USD"
              className="w-full h-[52px] px-4 rounded-lg border border-white/12 bg-white/8 text-white text-[15px] font-body placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-brand-orange disabled:opacity-60 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            {amountWarn && (
              <p className="flex items-center gap-1.5 text-[12px] font-semibold text-[#f0c878]" role="alert">
                <Icon name="TriangleAlert" size={13} />
                {amountWarn}
              </p>
            )}
          </div>

          {/* Record entry button */}
          <button
            type="button"
            disabled={loading}
            onClick={handleRecord}
            aria-label="Record entry"
            className={cn(
              "flex items-center justify-center gap-2 w-full h-[52px] mt-2 rounded-xl font-display font-bold text-[16px] text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange",
              loading
                ? "bg-brand-orange/60 cursor-not-allowed"
                : "bg-brand-orange hover:bg-brand-orange-hover",
            )}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Recording…
              </>
            ) : (
              <>
                <Icon name="Check" size={20} />
                Record entry
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
