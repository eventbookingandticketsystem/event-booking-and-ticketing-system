import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import prisma from "../../../../../prisma/client";
import { ok, forbidden, badRequest, serverError } from "@/lib/api-utils";
import { lookupSchema } from "@/lib/validation/scan.schemas";
import { getEventWindowStatus } from "@/lib/event-window";

// ── Lookup outcome discriminated union — mirrors /api/scan's ScanOutcome ───
// shape, but adds full ticket/attendee/event detail and never writes anything.
type EventInfo = { id: string; title: string; venue: string; city: string; date: string };

type LookupOutcome =
  | {
      valid: true;
      ticket: {
        id: string;
        ticketRef: string;
        tier: string;
        status: string;
        issuedAt: string;
      };
      attendee: { name: string | null; email: string | null; phone: string | null };
      booking: { ref: string; total: number; method: string };
      event: EventInfo;
    }
  | { valid: false; result: "ALREADY_USED"; message: string; usedAt: string | null; event: EventInfo }
  | { valid: false; result: "EXPIRED";      message: string; event: EventInfo }
  | { valid: false; result: "WRONG_EVENT";  message: string }
  | { valid: false; result: "TOO_EARLY";    message: string; opensAt: string;  event: EventInfo }
  | { valid: false; result: "EVENT_ENDED";  message: string; closedAt: string; event: EventInfo }
  | { valid: false; result: "INVALID";      message: string };

// ── POST /api/scan/lookup — read-only QR lookup, no mutation, no ScanRecord ─
export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req });
    if (!token?.id) return forbidden("Authentication required");

    const body   = await req.json();
    const parsed = lookupSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(
        parsed.error.issues.map((i: { message: string }) => i.message).join(", "),
      );
    }

    const { qrPayload, eventId } = parsed.data;

    const parts = qrPayload.split(":");
    if (parts.length < 3) {
      const outcome: LookupOutcome = { valid: false, result: "INVALID", message: "Malformed QR code" };
      return ok(outcome);
    }

    const ticketRef = parts[0];

    const ticket = await prisma.ticket.findFirst({
      where: { ticketRef, qrPayload },
      include: {
        owner:   { select: { name: true, email: true, phone: true } },
        booking: { select: { ref: true, total: true, method: true } },
        event:   { select: { id: true, title: true, venue: true, city: true, date: true } },
      },
    });

    if (!ticket) {
      const outcome: LookupOutcome = { valid: false, result: "INVALID", message: "Ticket not found" };
      return ok(outcome);
    }

    if (ticket.eventId !== eventId) {
      const outcome: LookupOutcome = {
        valid: false,
        result: "WRONG_EVENT",
        message: "Ticket is for a different event",
      };
      return ok(outcome);
    }

    const event: EventInfo = {
      id:    ticket.event.id,
      title: ticket.event.title,
      venue: ticket.event.venue,
      city:  ticket.event.city,
      date:  ticket.event.date.toISOString(),
    };

    const windowStatus = getEventWindowStatus(ticket.event.date);

    if (windowStatus.state === "TOO_EARLY") {
      const outcome: LookupOutcome = {
        valid: false,
        result: "TOO_EARLY",
        message: "Too early — gate is not open yet",
        opensAt: windowStatus.opensAt.toISOString(),
        event,
      };
      return ok(outcome);
    }

    if (windowStatus.state === "EVENT_ENDED") {
      const outcome: LookupOutcome = {
        valid: false,
        result: "EVENT_ENDED",
        message: "Too late — the event has ended",
        closedAt: windowStatus.closedAt.toISOString(),
        event,
      };
      return ok(outcome);
    }

    if (ticket.status === "USED") {
      const outcome: LookupOutcome = {
        valid: false,
        result: "ALREADY_USED",
        message: "Ticket has already been scanned",
        usedAt: ticket.usedAt?.toISOString() ?? null,
        event,
      };
      return ok(outcome);
    }

    const isExpiredStatus = ticket.status === "EXPIRED";
    const isExpiredDate   = ticket.expiresAt != null && ticket.expiresAt < new Date();
    if (isExpiredStatus || isExpiredDate) {
      const outcome: LookupOutcome = { valid: false, result: "EXPIRED", message: "Ticket has expired", event };
      return ok(outcome);
    }

    const outcome: LookupOutcome = {
      valid: true,
      ticket: {
        id:        ticket.id,
        ticketRef: ticket.ticketRef,
        tier:      ticket.tier,
        status:    ticket.status,
        issuedAt:  ticket.issuedAt.toISOString(),
      },
      attendee: {
        name:  ticket.owner.name,
        email: ticket.owner.email,
        phone: ticket.owner.phone,
      },
      booking: {
        ref:    ticket.booking.ref,
        total:  ticket.booking.total,
        method: ticket.booking.method,
      },
      event,
    };

    return ok(outcome);
  } catch (e) {
    return serverError(e);
  }
}
