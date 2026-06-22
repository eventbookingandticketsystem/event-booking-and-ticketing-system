import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import prisma from "../../../../prisma/client";
import { ok, forbidden, badRequest, serverError } from "@/lib/api-utils";
import { scanSchema } from "@/lib/validation/scan.schemas";

// ── Scan outcome discriminated union ──────────────────────────────────────
type ScanOutcome =
  | { result: "ADMIT";       attendee: string; tier: string; ticketRef: string }
  | { result: "ALREADY_USED"; message: string; usedAt: Date | null }
  | { result: "EXPIRED";     message: string }
  | { result: "WRONG_EVENT"; message: string }
  | { result: "INVALID";     message: string };

// ── POST /api/scan — auth required (any role) ─────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req });
    if (!token?.id) return forbidden("Authentication required");

    const body   = await req.json();
    const parsed = scanSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(
        parsed.error.issues.map((i: { message: string }) => i.message).join(", "),
      );
    }

    const { qrPayload, eventId, gate, agentId } = parsed.data;

    // All scan logic runs atomically.
    // MongoDB requires a replica set for interactive transactions.
    // If the environment does not support transactions, each write
    // is still issued sequentially and the fallback comment below applies.
    let result: ScanOutcome;

    try {
      result = await prisma.$transaction(async (tx) => {
        // ── A: Parse payload ───────────────────────────────────────────────
        // Expected format: "ticketRef:eventId:userId"
        const parts = qrPayload.split(":");

        if (parts.length < 3) {
          await tx.scanRecord.create({
            data: {
              eventId,
              agentId,
              gate,
              result:    "INVALID",
              ticketRef: qrPayload,
              note:      "Malformed QR code",
            },
          });
          return { result: "INVALID" as const, message: "Malformed QR code" };
        }

        const ticketRef = parts[0];

        // ── B: Look up ticket ──────────────────────────────────────────────
        const ticket = await tx.ticket.findFirst({
          where: { ticketRef, qrPayload },
          include: {
            owner: { select: { id: true, name: true } },
          },
        });

        if (!ticket) {
          await tx.scanRecord.create({
            data: {
              eventId,
              agentId,
              gate,
              result:    "INVALID",
              ticketRef,
              note:      "Ticket not found",
            },
          });
          return { result: "INVALID" as const, message: "Ticket not found" };
        }

        // ── C: Wrong event check ───────────────────────────────────────────
        if (ticket.eventId !== eventId) {
          await tx.scanRecord.create({
            data: {
              eventId,
              agentId,
              gate,
              result:   "WRONG_EVENT",
              ticketId: ticket.id,
              ticketRef,
              note:     "Ticket is for a different event",
            },
          });
          return {
            result:  "WRONG_EVENT" as const,
            message: "Ticket is for a different event",
          };
        }

        // ── D: Already used check ──────────────────────────────────────────
        if (ticket.status === "USED") {
          await tx.scanRecord.create({
            data: {
              eventId,
              agentId,
              gate,
              result:   "ALREADY_USED",
              ticketId: ticket.id,
              ticketRef,
              note:     "Ticket has already been scanned",
            },
          });
          return {
            result:  "ALREADY_USED" as const,
            message: "Ticket has already been scanned",
            usedAt:  ticket.usedAt,
          };
        }

        // ── E: Expired check ───────────────────────────────────────────────
        const isExpiredStatus = ticket.status === "EXPIRED";
        const isExpiredDate   =
          ticket.expiresAt != null && ticket.expiresAt < new Date();

        if (isExpiredStatus || isExpiredDate) {
          await tx.scanRecord.create({
            data: {
              eventId,
              agentId,
              gate,
              result:   "EXPIRED",
              ticketId: ticket.id,
              ticketRef,
              note:     "Ticket has expired",
            },
          });
          return { result: "EXPIRED" as const, message: "Ticket has expired" };
        }

        // ── F: ADMIT ───────────────────────────────────────────────────────
        await tx.ticket.update({
          where: { id: ticket.id },
          data:  { status: "USED", usedAt: new Date() },
        });

        await tx.gateAgent.update({
          where: { id: agentId },
          data:  { scansToday: { increment: 1 }, lastActiveAt: new Date() },
        });

        await tx.scanRecord.create({
          data: {
            eventId,
            agentId,
            gate,
            result:   "ADMIT",
            ticketId: ticket.id,
            ticketRef,
          },
        });

        return {
          result:    "ADMIT" as const,
          attendee:  ticket.owner.name ?? "Guest",
          tier:      ticket.tier,
          ticketRef: ticket.ticketRef,
        };
      });
    } catch (txErr) {
      // Fallback: if the DB does not support transactions (standalone MongoDB),
      // the interactive transaction throws. Surface the error — the caller
      // should ensure a replica set is available in production.
      throw txErr;
    }

    return ok(result);
  } catch (e) {
    return serverError(e);
  }
}
