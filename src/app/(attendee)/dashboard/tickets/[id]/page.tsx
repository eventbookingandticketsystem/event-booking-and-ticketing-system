'use client';

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { notFound } from "next/navigation";
import { StatusPill } from "@/components/Shared/StatusPill";
import { AlertBanner } from "@/components/Shared/AlertBanner";
import { Icon } from "@/components/Shared/Icon";
import { MY_TICKETS, EVENT_BY_ID } from "@/lib/mock-data";
import { generateTicketQR } from "@/lib/qr-utils";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function QRViewPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();

  const ticket = MY_TICKETS.find((t) => t.id === id);
  if (!ticket) notFound();

  const event = EVENT_BY_ID[ticket.eventId];
  if (!event) notFound();

  const [qrSrc, setQrSrc] = useState<string | null>(null);
  const [tipVisible, setTipVisible] = useState(true);
  const [toast, setToast] = useState(false);

  useEffect(() => {
    generateTicketQR(ticket.id)
      .then((src) => setQrSrc(src))
      .catch(() => setQrSrc(null));
  }, [ticket.id]);

  const handleShare = () => {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(window.location.href).catch(() => {});
    }
    setToast(true);
    setTimeout(() => setToast(false), 1800);
  };

  return (
    <div className="flex flex-col">
      {/* Top bar — mobile only */}
      <div className="flex md:hidden items-center gap-3 px-[18px] pt-4 pb-3 bg-surface border-b border-border shrink-0">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Go back"
          className="w-9 h-9 rounded-full bg-surface-bg inline-flex items-center justify-center hover:bg-border/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
        >
          <Icon name="ArrowLeft" size={18} />
        </button>
        <h1 className="font-display font-semibold text-[18px] text-text flex-1 m-0">Your ticket</h1>
        <button
          type="button"
          onClick={handleShare}
          aria-label="Share ticket"
          className="w-9 h-9 rounded-full bg-surface-bg inline-flex items-center justify-center hover:bg-border/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
        >
          <Icon name="Share2" size={18} />
        </button>
      </div>

      {/* Desktop action row — hidden on mobile */}
      <div className="hidden md:flex items-center justify-between w-full max-w-2xl mx-auto px-8 pt-6 pb-2">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Go back"
          className="flex items-center gap-1.5 text-sm font-medium text-text-secondary hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange rounded"
        >
          <Icon name="ArrowLeft" size={16} />
          Back
        </button>
        <button
          type="button"
          onClick={handleShare}
          aria-label="Share ticket"
          className="flex items-center gap-1.5 text-sm font-medium text-text-secondary hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange rounded"
        >
          <Icon name="Share2" size={16} />
          Share
        </button>
      </div>

      {/* Content — centred on desktop */}
      <div className="flex-1 overflow-y-auto">
        <div className="w-full max-w-2xl mx-auto px-4 md:px-8">
          {/* Brightness tip */}
          {tipVisible && (
            <div className="pt-3 pb-1.5">
              <div className="relative">
                <AlertBanner
                  tone="info"
                  message="Increase your screen brightness for faster scanning."
                />
                <button
                  type="button"
                  onClick={() => setTipVisible(false)}
                  aria-label="Dismiss tip"
                  className="absolute top-2.5 right-2.5 w-6 h-6 inline-flex items-center justify-center text-status-info hover:opacity-70 focus-visible:outline-none"
                >
                  <Icon name="X" size={14} />
                </button>
              </div>
            </div>
          )}

          {/* QR view */}
          <div className="flex flex-col items-center text-center pt-4 pb-8">
            <h2 className="font-display font-bold text-[20px] text-text leading-snug mb-0.5">
              {event.title}
            </h2>
            <p className="text-[13px] text-text-secondary mb-5">
              {event.date} · {event.venue}
            </p>

            {/* QR code card */}
            <div className="p-[18px] bg-white border border-border rounded-lg shadow-card mb-[18px]">
              {qrSrc ? (
                <img
                  src={qrSrc}
                  alt="Ticket QR code"
                  width={240}
                  height={240}
                  className="block"
                />
              ) : (
                <div className="w-[240px] h-[240px] skeleton rounded" />
              )}
            </div>

            {/* Ticket ID */}
            <p className="font-mono text-sm text-text mb-3.5 tracking-[0.5px]">
              {ticket.id}
            </p>

            {/* Tier + status badges */}
            <div className="flex gap-2 items-center justify-center mb-[18px]">
              <span className="inline-flex items-center px-3 py-1 rounded-sm bg-brand-navy/8 text-brand-navy text-[13px] font-semibold">
                {ticket.tier}
              </span>
              <StatusPill status={ticket.status} />
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className="fixed left-1/2 bottom-8 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-pill text-sm font-semibold text-white shadow-pop"
          style={{ background: "#1a7a4a" }}
          role="status"
          aria-live="polite"
        >
          <Icon name="Check" size={15} />
          Link copied
        </div>
      )}
    </div>
  );
}
