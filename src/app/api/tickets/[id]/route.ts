import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import prisma from "../../../../../prisma/client";
import { ok, forbidden, notFound, serverError } from "@/lib/api-utils";

// ── Access control helper ──────────────────────────────────────────────────
type TicketWithRelations = NonNullable<Awaited<ReturnType<typeof fetchTicket>>>;

async function fetchTicket(id: string) {
  return prisma.ticket.findUnique({
    where: { id },
    include: {
      event: {
        include: {
          orgProfile: { select: { userId: true } },
        },
      },
      booking: {
        select: {
          id:     true,
          ref:    true,
          status: true,
          total:  true,
          paidAt: true,
          method: true,
        },
      },
      tierModel: {
        select: {
          id:       true,
          name:     true,
          price:    true,
          capacity: true,
        },
      },
      scans: {
        orderBy: { scannedAt: "desc" },
        take:    10,
        select: {
          id:        true,
          result:    true,
          scannedAt: true,
          gate:      true,
          note:      true,
        },
      },
    },
  });
}

function canAccess(
  ticket: TicketWithRelations,
  tokenId: string,
  tokenRole: unknown,
): boolean {
  if (tokenRole === "ADMIN") return true;
  // Any role can view a ticket they personally own
  if (ticket.ownerId === tokenId) return true;
  // Organizers can view tickets for their events
  if (tokenRole === "ORGANIZER") {
    return ticket.event.orgProfile?.userId === tokenId;
  }
  return false;
}

// ── GET /api/tickets/[id] — auth required ─────────────────────────────────
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token = await getToken({ req });
    if (!token?.id) return forbidden("Authentication required");

    const { id } = await params;

    // Support lookup by ticketRef as well as database id
    let ticket: TicketWithRelations | null = null;

    // Try id first, then ticketRef
    if (id.startsWith("TIX-")) {
      ticket = await prisma.ticket.findUnique({
        where: { ticketRef: id },
        include: {
          event: {
            include: {
              orgProfile: { select: { userId: true } },
            },
          },
          booking: {
            select: {
              id:     true,
              ref:    true,
              status: true,
              total:  true,
              paidAt: true,
              method: true,
            },
          },
          tierModel: {
            select: {
              id:       true,
              name:     true,
              price:    true,
              capacity: true,
            },
          },
          scans: {
            orderBy: { scannedAt: "desc" },
            take:    10,
            select: {
              id:        true,
              result:    true,
              scannedAt: true,
              gate:      true,
              note:      true,
            },
          },
        },
      });
    } else {
      ticket = await fetchTicket(id);
    }

    if (!ticket) return notFound("Ticket not found");

    if (!canAccess(ticket, token.id as string, token.role)) {
      return forbidden("Access denied");
    }

    return ok(ticket);
  } catch (e) {
    return serverError(e);
  }
}
