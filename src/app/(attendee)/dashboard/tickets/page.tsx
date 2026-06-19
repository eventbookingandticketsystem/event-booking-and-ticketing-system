'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TicketCard } from "@/components/Shared/TicketCard";
import { SkeletonCard } from "@/components/Shared/SkeletonCard";
import { EmptyState } from "@/components/Shared/EmptyState";
import { AlertBanner } from "@/components/Shared/AlertBanner";
import { Button } from "@/components/Shared/Button";
import { cn } from "@/lib/utils";
import { useTickets } from "@/lib/api/hooks/useTickets";
import { ROUTES } from "@/constants/routes";

export default function TicketsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");

  const { data: allTickets, isLoading, isError, error } = useTickets();

  const tickets = (allTickets ?? []).filter((t) => t.when === tab);

  return (
    <div className="flex flex-col">
      {/* Top bar — mobile only */}
      <div className="flex md:hidden items-center gap-3 px-[18px] pt-4 pb-3 bg-surface border-b border-border shrink-0">
        <h1 className="font-display font-semibold text-[22px] text-text flex-1 m-0">
          My tickets
        </h1>
      </div>

      {/* Content wrapper — centred on desktop */}
      <div className="w-full max-w-3xl mx-auto px-4 md:px-8">
        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-surface-bg rounded-md mt-4 md:mt-6" role="tablist">
          {(["upcoming", "past"] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={cn(
                "flex-1 h-[38px] rounded-sm text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange",
                tab === t
                  ? "bg-surface text-text shadow-card"
                  : "bg-transparent text-text-secondary hover:text-text",
              )}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Ticket list */}
        <div className="pt-4 pb-8 flex flex-col gap-3">
          {isLoading ? (
            // Loading skeleton — 3 cards matching ticket card dimensions
            Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCard key={i} className="h-[148px]" />
            ))
          ) : isError ? (
            <AlertBanner
              tone="danger"
              message={(error as Error)?.message ?? "Failed to load tickets. Please try again."}
            />
          ) : tickets.length === 0 ? (
            tab === "upcoming" ? (
              <EmptyState
                icon="Ticket"
                heading="No upcoming tickets"
                subtext="Browse events to book your first ticket."
                cta={
                  <Button
                    size="sm"
                    onClick={() => router.push(ROUTES.DASHBOARD)}
                    className="mt-1"
                  >
                    Browse events
                  </Button>
                }
              />
            ) : (
              <EmptyState
                icon="Clock"
                heading="No past events yet"
                subtext="Tickets you've used will appear here after the event."
              />
            )
          ) : (
            tickets.map((ticket) => {
              // Use the embedded event summary from the API response
              const eventSummary = ticket.event;
              if (!eventSummary) return null;

              return (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  event={eventSummary}
                  onClick={() => router.push(ROUTES.TICKET_QR(ticket.id))}
                />
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
