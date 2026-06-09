'use client';

import { useState } from "react";
import { OrgTopbar } from "@/components/Organizer/OrgTopbar";
import { Modal } from "@/components/Shared/Modal";
import { Button } from "@/components/Shared/Button";
import { Icon } from "@/components/Shared/Icon";
import { PhoneInput } from "@/components/Shared/PhoneInput";
import { AlertBanner } from "@/components/Shared/AlertBanner";
import { DEFAULT_PHONE, type PhoneValue } from "@/constants/countries";
import { cn } from "@/lib/utils";

const API_KEY = "atsk_live_7f3c9a21b8e4d6105fa2c0993ee1";

interface Notif {
  booking: boolean;
  fraud: boolean;
  daily: boolean;
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
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

export default function OrgSettingsPage() {
  const [name, setName] = useState("Rebecca Mayen");
  const [email, setEmail] = useState("rebecca@nilelive.ss");
  const [phone, setPhone] = useState<PhoneValue>({ ...DEFAULT_PHONE, num: "922700145" });
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [notif, setNotif] = useState<Notif>({ booking: true, fraud: true, daily: false });
  const [delModal, setDelModal] = useState(false);
  const [delConfirm, setDelConfirm] = useState("");
  const [saveToast, setSaveToast] = useState(false);

  const handleSave = () => {
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2000);
  };

  const handleCopy = () => {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(API_KEY).catch(() => {});
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  const toggleNotif = (k: keyof Notif) => setNotif((n) => ({ ...n, [k]: !n[k] }));

  return (
    <div className="flex flex-col min-h-full">
      <OrgTopbar crumb="Settings" />

      <div className="px-6 pt-5 pb-10">
        <h1 className="font-display font-bold text-[26px] text-text mb-0.5">Settings</h1>
        <p className="text-sm text-text-secondary mb-6">Manage your profile, integrations, and alerts.</p>

        <div className="flex flex-col gap-5 max-w-[820px]">
          {/* Profile section */}
          <div className="bg-surface border border-border rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="font-display font-semibold text-[17px] text-text m-0">Profile</h2>
              <Button size="sm" variant="ghost" onClick={handleSave}>Save changes</Button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="set-name" className="text-sm font-semibold text-text font-body">Name</label>
                <input
                  id="set-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  aria-label="Full name"
                  className="w-full h-11 px-3.5 rounded-sm border border-border bg-white text-text text-[15px] font-body focus:outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="set-email" className="text-sm font-semibold text-text font-body">Email</label>
                <input
                  id="set-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-label="Email address"
                  className="w-full h-11 px-3.5 rounded-sm border border-border bg-white text-text text-[15px] font-body focus:outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20"
                />
              </div>
              <div className="md:col-span-2">
                <div className="text-sm font-semibold text-text font-body mb-1.5">Phone</div>
                <PhoneInput value={phone} onChange={setPhone} />
              </div>
            </div>
          </div>

          {/* API Configuration */}
          <div className="bg-surface border border-border rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="font-display font-semibold text-[17px] text-text m-0">API configuration</h2>
              <Button size="sm" variant="ghost" onClick={handleSave}>Save changes</Button>
            </div>
            <div className="p-6 flex flex-col gap-5">
              {/* API key */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-text font-body">Africa&apos;s Talking API key</label>
                <div className="flex items-stretch h-11 border border-border rounded-sm bg-white focus-within:border-brand-orange focus-within:ring-2 focus-within:ring-brand-orange/20">
                  <input
                    readOnly
                    type={showKey ? "text" : "password"}
                    value={API_KEY}
                    aria-label="API key"
                    className="flex-1 px-3.5 border-none outline-none bg-transparent font-mono text-[14px] text-text min-w-0"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey((s) => !s)}
                    aria-label={showKey ? "Hide API key" : "Show API key"}
                    className="px-3 text-text-muted hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange border-l border-border"
                  >
                    <Icon name={showKey ? "EyeOff" : "Eye"} size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={handleCopy}
                    aria-label="Copy API key"
                    className="px-3 text-text-muted hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange border-l border-border"
                  >
                    <Icon name={copied ? "Check" : "Copy"} size={16} />
                  </button>
                </div>
              </div>

              {/* Webhook URLs */}
              {[
                { label: "MTN webhook URL",    value: "https://api.tiketi.ss/hooks/mtn" },
                { label: "Airtel webhook URL", value: "https://api.tiketi.ss/hooks/airtel" },
              ].map((wh) => (
                <div key={wh.label} className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-text font-body">{wh.label}</label>
                  <div className="flex items-center h-11 px-3.5 gap-2 border border-border rounded-sm bg-surface-bg">
                    <Icon name="Link" size={15} className="text-text-muted shrink-0" />
                    <span className="font-mono text-[13px] text-text-secondary flex-1 truncate">{wh.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notification preferences */}
          <div className="bg-surface border border-border rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="font-display font-semibold text-[17px] text-text m-0">Notification preferences</h2>
              <Button size="sm" variant="ghost" onClick={handleSave}>Save changes</Button>
            </div>
            <div className="divide-y divide-border">
              {([
                { k: "booking", title: "Booking alerts",  desc: "Notify me when a ticket is sold" },
                { k: "fraud",   title: "Fraud alerts",    desc: "Notify me when a ticket is rejected at the gate" },
                { k: "daily",   title: "Daily summary",   desc: "Send a daily sales and attendance digest" },
              ] as const).map(({ k, title, desc }) => (
                <div key={k} className="flex items-center justify-between gap-4 px-6 py-4">
                  <div>
                    <div className="font-semibold text-[15px] text-text">{title}</div>
                    <div className="text-sm text-text-secondary mt-0.5">{desc}</div>
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
              <h2 className="font-display font-semibold text-[17px] text-status-danger m-0">Danger zone</h2>
            </div>
            <div className="p-6 flex items-center justify-between gap-4">
              <div>
                <div className="font-semibold text-[15px] text-text">Delete account</div>
                <div className="text-sm text-text-secondary mt-0.5">
                  Permanently delete your account and all event data. This cannot be undone.
                </div>
              </div>
              <Button variant="danger" onClick={() => setDelModal(true)} className="shrink-0">
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
          onClose={() => { setDelModal(false); setDelConfirm(""); }}
          footer={
            <>
              <Button variant="ghost" onClick={() => { setDelModal(false); setDelConfirm(""); }}>Cancel</Button>
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
              <label htmlFor="del-confirm" className="text-sm font-semibold text-text font-body">
                Type <span className="font-mono text-status-danger">DELETE</span> to confirm
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
