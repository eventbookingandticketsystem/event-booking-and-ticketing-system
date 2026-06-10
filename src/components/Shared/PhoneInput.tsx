'use client';

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { PHONE_COUNTRIES, type PhoneValue } from "@/constants/countries";
import { Icon } from "./Icon";

interface PhoneInputProps {
  value: PhoneValue;
  onChange: (val: PhoneValue) => void;
  error?: string;
  disabled?: boolean;
  label?: string;
}

export function PhoneInput({ value, onChange, error, disabled = false, label = "Phone number" }: PhoneInputProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = PHONE_COUNTRIES.find((c) => c.code === value.code) ?? PHONE_COUNTRIES[0];

  const filtered = search.trim()
    ? PHONE_COUNTRIES.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.dial.includes(search),
      )
    : PHONE_COUNTRIES;

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Focus search when dropdown opens
  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [open]);

  const handleNum = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 12);
    onChange({ ...value, num: digits });
  };

  const handleSelect = (country: typeof PHONE_COUNTRIES[number]) => {
    onChange({ ...value, dial: country.dial, code: country.code });
    setOpen(false);
    setSearch("");
  };

  const fieldId = "phone-num-input";

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={fieldId} className="text-sm font-semibold text-text font-body">
        {label}
      </label>
      <div ref={containerRef} className="relative">
        {/* Input row */}
        <div
          className={cn(
            "relative flex items-stretch h-11 border rounded-sm bg-white transition-colors duration-150",
            error ? "border-status-danger" : "border-border",
            "focus-within:border-brand-orange focus-within:ring-2 focus-within:ring-brand-orange/20",
          )}
        >
          {/* Country trigger */}
          <button
            type="button"
            disabled={disabled}
            onClick={() => setOpen((o) => !o)}
            aria-label="Select country code"
            aria-expanded={open}
            aria-haspopup="listbox"
            className="flex items-center gap-1.5 px-3 border-r border-border bg-surface-bg rounded-l-sm hover:bg-border/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-orange disabled:opacity-60 shrink-0"
          >
            {/* Country flag */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://flagcdn.com/w20/${selected.code.toLowerCase()}.png`}
              alt={selected.name}
              className="w-6.5 h-4.5 object-cover rounded-[3px] shrink-0"
            />
            <span className="text-sm font-medium text-text">{selected.dial}</span>
            <Icon name="ChevronDown" size={14} className="text-text-muted" />
          </button>
          {/* Number input */}
          <input
            id={fieldId}
            type="tel"
            inputMode="numeric"
            value={value.num}
            onChange={handleNum}
            disabled={disabled}
            placeholder="9XX XXX XXXX"
            aria-label={label}
            aria-invalid={!!error}
            aria-describedby={error ? "phone-error" : undefined}
            className="flex-1 border-none outline-none bg-transparent px-3.5 text-[15px] text-text font-body placeholder:text-text-muted min-w-0 disabled:opacity-60"
          />
        </div>

        {/* Dropdown */}
        {open && (
          <div
            role="listbox"
            aria-label="Select country"
            className="absolute top-[calc(100%+6px)] left-0 z-50 w-[280px] max-w-[92vw] bg-white border border-border rounded-md shadow-pop overflow-hidden"
          >
            {/* Search */}
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border">
              <Icon name="Search" size={14} className="text-text-muted shrink-0" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search country..."
                aria-label="Search countries"
                className="flex-1 border-none outline-none text-sm font-body text-text placeholder:text-text-muted min-w-0"
              />
            </div>
            {/* List */}
            <ul className="max-h-[230px] overflow-y-auto">
              {filtered.length === 0 ? (
                <li className="px-4 py-4 text-center text-sm text-text-secondary">No countries found</li>
              ) : (
                filtered.map((country) => (
                  <li key={country.code}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={country.code === value.code}
                      onClick={() => handleSelect(country)}
                      className={cn(
                        "flex items-center gap-2.5 w-full px-3 py-2.5 text-left hover:bg-surface-bg focus-visible:outline-none focus-visible:bg-surface-bg",
                        country.code === value.code && "bg-surface-alt",
                      )}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`https://flagcdn.com/w20/${country.code.toLowerCase()}.png`}
                        alt={country.name}
                        className="w-6.5 h-4.5 object-cover rounded-[3px] shrink-0"
                      />
                      <span className="flex-1 text-sm font-medium text-text truncate">{country.name}</span>
                      <span className="text-[13px] text-text-secondary shrink-0">{country.dial}</span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <p id="phone-error" role="alert" className="text-xs text-status-danger font-semibold">
          {error}
        </p>
      )}
    </div>
  );
}
