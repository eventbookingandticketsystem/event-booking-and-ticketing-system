'use client';

import { useState } from "react";
import { NumberField } from "@/components/Shared/NumberField";
import { Modal } from "@/components/Shared/Modal";
import { Button } from "@/components/Shared/Button";
import { Icon } from "@/components/Shared/Icon";
import { cn } from "@/lib/utils";

const CREDENTIALS = [
  {
    label: "Africa's Talking API key",
    value: "atsk_live_7f3c9a21b8e4d6105fa2c0993ee1",
  },
  {
    label: "MTN webhook secret",
    value: "mtn_whsec_4b8c1d9e0f2a6357c9d1e8b04a7f",
  },
  {
    label: "Airtel webhook secret",
    value: "airtel_whsec_2c7e9f1a3b5d8064e1f9a2c4d6b8",
  },
] as const;

function MaskedField({ label, value }: { label: string; value: string }) {
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(value).catch(() => {});
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-text font-body">{label}</label>
      <div className="flex items-stretch h-11 border border-border rounded-sm bg-white focus-within:border-brand-orange focus-within:ring-2 focus-within:ring-brand-orange/20 transition-colors">
        <input
          readOnly
          type={show ? "text" : "password"}
          value={value}
          aria-label={label}
          className="flex-1 px-3.5 border-none outline-none bg-transparent font-mono text-[14px] text-text min-w-0"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? `Hide ${label}` : `Show ${label}`}
          className="px-3 text-text-muted hover:text-text transition-colors border-l border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
        >
          <Icon name={show ? "EyeOff" : "Eye"} size={16} />
        </button>
        <button
          type="button"
          onClick={handleCopy}
          aria-label={`Copy ${label}`}
          className="px-3 text-text-muted hover:text-text transition-colors border-l border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
        >
          <Icon name={copied ? "Check" : "Copy"} size={16} />
        </button>
      </div>
    </div>
  );
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

export default function AdminSettingsPage() {
  const [cfg, setCfg] = useState({ maxCats: 10, payTimeout: 5, smsRetries: 3 });
  const [maint, setMaint] = useState(false);
  const [maintConfirm, setMaintConfirm] = useState(false);
  const [rotateConfirm, setRotateConfirm] = useState(false);
  const [rotateInput, setRotateInput] = useState("");
  const [saveToast, setSaveToast] = useState(false);

  const setC =
    (k: keyof typeof cfg) =>
    (v: number | "") => {
      if (v !== "") setCfg({ ...cfg, [k]: v });
    };

  const handleSave = () => {
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2000);
  };

  return (
    <div className="flex flex-col min-h-full">
      <div className="px-6 pt-5 pb-10">
        <h1 className="font-display font-bold text-[26px] text-text mb-0.5">Settings</h1>
        <p className="text-sm text-text-secondary mb-6">
          Platform-wide credentials and configuration.
        </p>

        <div className="flex flex-col gap-5 max-w-[820px]">
          {/* Admin profile */}
          <div className="bg-surface border border-border rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="font-display font-semibold text-[17px] text-text m-0">Admin profile</h2>
              <Button size="sm" variant="ghost" onClick={handleSave}>
                Save changes
              </Button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="admin-name" className="text-sm font-semibold text-text font-body">
                  Name
                </label>
                <input
                  id="admin-name"
                  type="text"
                  defaultValue="System Admin"
                  aria-label="Admin name"
                  className="w-full h-11 px-3.5 rounded-sm border border-border bg-white text-text text-[15px] font-body focus:outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="admin-phone" className="text-sm font-semibold text-text font-body">
                  Phone
                </label>
                <input
                  id="admin-phone"
                  type="tel"
                  defaultValue="+211 920 000 001"
                  aria-label="Admin phone"
                  className="w-full h-11 px-3.5 rounded-sm border border-border bg-white text-text text-[15px] font-body font-mono focus:outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20"
                />
              </div>
            </div>
          </div>

          {/* API credentials */}
          <div className="bg-surface border border-border rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="font-display font-semibold text-[17px] text-text m-0">
                API credentials
              </h2>
              <Button size="sm" variant="ghost" onClick={handleSave}>
                Save changes
              </Button>
            </div>
            <div className="p-6 flex flex-col gap-5">
              {CREDENTIALS.map((c) => (
                <MaskedField key={c.label} label={c.label} value={c.value} />
              ))}
              {/* JWT — hidden, no reveal */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-text font-body">
                  JWT signing secret
                </label>
                <div className="flex items-stretch h-11 border border-border rounded-sm bg-surface-bg">
                  <input
                    readOnly
                    type="password"
                    value="jwt_sec_placeholder_hidden"
                    aria-label="JWT signing secret"
                    className="flex-1 px-3.5 border-none outline-none bg-transparent font-mono text-[14px] text-text-muted min-w-0"
                  />
                  <span className="px-3 flex items-center text-xs text-text-secondary border-l border-border">
                    Hidden
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* System configuration */}
          <div className="bg-surface border border-border rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="font-display font-semibold text-[17px] text-text m-0">
                System configuration
              </h2>
              <Button size="sm" variant="ghost" onClick={handleSave}>
                Save changes
              </Button>
            </div>
            <div className="p-6 flex flex-col gap-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <NumberField
                  label="Max ticket categories per event"
                  min={1}
                  max={20}
                  value={cfg.maxCats}
                  onChange={setC("maxCats")}
                />
                <NumberField
                  label="Payment timeout (minutes)"
                  min={1}
                  max={60}
                  value={cfg.payTimeout}
                  onChange={setC("payTimeout")}
                />
                <NumberField
                  label="SMS retry attempts"
                  min={1}
                  max={10}
                  value={cfg.smsRetries}
                  onChange={setC("smsRetries")}
                />
              </div>
              {/* Maintenance mode toggle */}
              <div className="flex items-center justify-between gap-4 pt-4 border-t border-border">
                <div>
                  <div className="font-semibold text-[15px] text-text">Maintenance mode</div>
                  <div className="text-sm text-text-secondary mt-0.5">
                    Takes the platform offline for all users. Only admins can sign in.
                  </div>
                </div>
                <Toggle
                  checked={maint}
                  onChange={() => {
                    if (maint) setMaint(false);
                    else setMaintConfirm(true);
                  }}
                  label="Maintenance mode"
                />
              </div>
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
                <div className="font-semibold text-[15px] text-text">Rotate JWT signing secret</div>
                <div className="text-sm text-text-secondary mt-0.5">
                  Rotating invalidates all active tickets and signs every user out. This cannot be
                  undone.
                </div>
              </div>
              <Button
                variant="danger"
                className="gap-2 shrink-0"
                onClick={() => setRotateConfirm(true)}
              >
                <Icon name="KeyRound" size={15} />
                Rotate key
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Maintenance mode confirm */}
      {maintConfirm && (
        <Modal
          open
          title="Enable maintenance mode?"
          description="All attendees, organizers, and gate agents will be locked out until you turn it off."
          onClose={() => setMaintConfirm(false)}
          footer={
            <>
              <Button variant="ghost" onClick={() => setMaintConfirm(false)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                className="gap-2"
                onClick={() => {
                  setMaint(true);
                  setMaintConfirm(false);
                }}
              >
                <Icon name="Power" size={15} />
                Enable maintenance
              </Button>
            </>
          }
        >
          <p className="text-sm text-text-secondary">
            In-progress payments and gate scans will fail while maintenance is active.
          </p>
        </Modal>
      )}

      {/* Rotate JWT confirm */}
      {rotateConfirm && (
        <Modal
          open
          title="Rotate JWT signing secret?"
          description="This invalidates every active ticket and signs out all users immediately. This cannot be undone."
          onClose={() => {
            setRotateConfirm(false);
            setRotateInput("");
          }}
          footer={
            <>
              <Button
                variant="ghost"
                onClick={() => {
                  setRotateConfirm(false);
                  setRotateInput("");
                }}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                className="gap-2"
                disabled={rotateInput !== "ROTATE"}
                onClick={() => {
                  setRotateConfirm(false);
                  setRotateInput("");
                }}
              >
                <Icon name="KeyRound" size={15} />
                Rotate secret
              </Button>
            </>
          }
        >
          <div className="flex flex-col gap-1.5 py-2">
            <label
              htmlFor="rotate-confirm"
              className="text-sm font-semibold text-text font-body"
            >
              Type{" "}
              <span className="font-mono text-status-danger">ROTATE</span> to confirm
            </label>
            <input
              id="rotate-confirm"
              type="text"
              value={rotateInput}
              onChange={(e) => setRotateInput(e.target.value)}
              placeholder="ROTATE"
              aria-label="Type ROTATE to confirm"
              className="w-full h-11 px-3.5 rounded-sm border border-border bg-white text-text text-[15px] font-body focus:outline-none focus:border-status-danger focus:ring-2 focus:ring-status-danger/20"
            />
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
