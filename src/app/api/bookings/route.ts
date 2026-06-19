import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import prisma from "../../../../prisma/client";
import {
  created,
  badRequest,
  forbidden,
  serverError,
  paginated,
  generateBookingRef,
  generateTicketRef,
} from "@/lib/api-utils";
import { createBookingSchema } from "@/lib/validation/booking.schemas";
import { Prisma } from "@prisma/client";

const SERVICE_FEE = 1; // $1 fixed service fee

// ── GET /api/bookings ──────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req });
    if (!token?.id) return forbidden("Authentication required");

    const { searchParams } = req.nextUrl;
    const statusParam = searchParams.get("status") ?? undefined;
    const page  = Math.max(1, Number(searchParams.get("page")  ?? 1));
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 10)));
    const skip  = (page - 1) * limit;

    // Role-based ownership filter
    let ownerFilter: Prisma.BookingWhereInput = {};
    if (token.role === "ATTENDEE" || !token.role) {
      ownerFilter = { userId: token.id as string };
    } else if (token.role === "ORGANIZER") {
      ownerFilter = {
        event: { orgProfile: { userId: token.id as string } },
      };
    }
    // ADMIN: no extra filter

    const where: Prisma.BookingWhereInput = {
      ...ownerFilter,
      ...(statusParam && { status: statusParam as Prisma.EnumBookingStatusFilter }),
    };

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip,
        take:    limit,
        orderBy: { createdAt: "desc" },
        include: {
          event: { select: { id: true, title: true, date: true, venue: true } },
          lines: {
            include: { tier: { select: { id: true, name: true } } },
          },
          tickets: { select: { id: true, ticketRef: true, status: true, tier: true } },
        },
      }),
      prisma.booking.count({ where }),
    ]);

    return paginated(bookings, page, limit, total);
  } catch (e) {
    return serverError(e);
  }
}

// ── POST /api/bookings ─────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req });
    if (!token?.id) return forbidden("Authentication required");
    if (token.role !== "ATTENDEE" && token.role !== undefined && token.role !== null) {
      // Gate agents and admins shouldn't book — organisers can for demo
    }

    const body   = await req.json();
    const parsed = createBookingSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(
        parsed.error.issues.map((i: { message: string }) => i.message).join(", "),
      );
    }

    const { eventId, lines, method } = parsed.data;
    const tierIds = lines.map((l) => l.tierId);

    // 1. Fetch all tiers in one query
    const tiers = await prisma.ticketTier.findMany({
      where: { id: { in: tierIds } },
    });

    // 2. Validate tiers
    if (tiers.length !== tierIds.length) {
      return badRequest("One or more ticket tiers not found");
    }
    for (const tier of tiers) {
      if (tier.eventId !== eventId) {
        return badRequest(`Tier "${tier.name}" does not belong to this event`);
      }
      if (tier.soldOut) {
        return badRequest(`Tier "${tier.name}" is sold out`);
      }
    }
    for (const line of lines) {
      const tier = tiers.find((t) => t.id === line.tierId)!;
      if (tier.remaining < line.qty) {
        return badRequest(
          `Only ${tier.remaining} ticket(s) remaining for "${tier.name}"`,
        );
      }
    }

    // 3. Calculate totals
    const subtotal = lines.reduce((sum, line) => {
      const tier = tiers.find((t) => t.id === line.tierId)!;
      return sum + tier.price * line.qty;
    }, 0);
    const total = subtotal + SERVICE_FEE;

    // 4. Transaction: decrement tiers, create booking, lines, tickets
    const booking = await prisma.$transaction(async (tx) => {
      // Decrement remaining on each tier
      for (const line of lines) {
        const tier = tiers.find((t) => t.id === line.tierId)!;
        const newRemaining = tier.remaining - line.qty;
        await tx.ticketTier.update({
          where: { id: tier.id },
          data: {
            remaining: newRemaining <= 0 ? 0 : newRemaining,
            soldOut:   newRemaining <= 0,
            lowStock:  newRemaining > 0 && newRemaining / tier.capacity < 0.1,
          },
        });
      }

      // Create booking
      const newBooking = await tx.booking.create({
        data: {
          ref:        generateBookingRef(),
          userId:     token.id as string,
          eventId,
          method,
          subtotal,
          serviceFee: SERVICE_FEE,
          total,
          status:     "PENDING",
          lines: {
            create: lines.map((line) => {
              const tier = tiers.find((t) => t.id === line.tierId)!;
              return {
                tierId:    tier.id,
                qty:       line.qty,
                unitPrice: tier.price,
                subtotal:  tier.price * line.qty,
              };
            }),
          },
        },
      });

      // Create one ticket per qty unit
      const ticketData: Prisma.TicketCreateManyInput[] = [];
      for (const line of lines) {
        const tier = tiers.find((t) => t.id === line.tierId)!;
        for (let i = 0; i < line.qty; i++) {
          const ref = generateTicketRef();
          ticketData.push({
            ticketRef:  ref,
            tier:       tier.name,
            status:     "VALID",
            qrPayload:  `${ref}:${eventId}:${token.id as string}`,
            ownerId:    token.id as string,
            eventId,
            bookingId:  newBooking.id,
            tierId:     tier.id,
          });
        }
      }

      await tx.ticket.createMany({ data: ticketData });

      // Return booking with lines and tickets
      return tx.booking.findUnique({
        where: { id: newBooking.id },
        include: {
          lines:   { include: { tier: { select: { id: true, name: true } } } },
          tickets: { select: { id: true, ticketRef: true, status: true, tier: true } },
          event:   { select: { id: true, title: true, date: true, venue: true } },
        },
      });
    });

    return created(booking);
  } catch (e) {
    return serverError(e);
  }
}
