import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import prisma from "../../../../../prisma/client";
import {
  ok,
  forbidden,
  notFound,
  badRequest,
  serverError,
} from "@/lib/api-utils";
import { updateBookingSchema } from "@/lib/validation/booking.schemas";

// ── Access control helper ──────────────────────────────────────────────────
type BookingWithRelations = Awaited<ReturnType<typeof fetchBooking>>;

async function fetchBooking(id: string) {
  return prisma.booking.findUnique({
    where: { id },
    include: {
      event: {
        include: { orgProfile: { select: { userId: true } } },
      },
      lines:   { include: { tier: { select: { id: true, name: true } } } },
      tickets: { select: { id: true, ticketRef: true, status: true, tier: true } },
    },
  });
}

function canAccess(
  booking: NonNullable<BookingWithRelations>,
  tokenId: string,
  tokenRole: unknown,
): boolean {
  if (tokenRole === "ADMIN") return true;
  if (tokenRole === "ORGANIZER") {
    return booking.event.orgProfile?.userId === tokenId;
  }
  // ATTENDEE or any other role — must own the booking
  return booking.userId === tokenId;
}

// ── GET /api/bookings/[id] ─────────────────────────────────────────────────
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token = await getToken({ req });
    if (!token?.id) return forbidden("Authentication required");

    const { id } = await params;
    const booking = await fetchBooking(id);
    if (!booking) return notFound("Booking not found");

    if (!canAccess(booking, token.id as string, token.role)) {
      return forbidden("Access denied");
    }

    return ok(booking);
  } catch (e) {
    return serverError(e);
  }
}

// ── PATCH /api/bookings/[id] — simulate payment status ────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token = await getToken({ req });
    if (!token?.id) return forbidden("Authentication required");

    const { id } = await params;
    const booking = await fetchBooking(id);
    if (!booking) return notFound("Booking not found");

    if (!canAccess(booking, token.id as string, token.role)) {
      return forbidden("Access denied");
    }

    const body   = await req.json();
    const parsed = updateBookingSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(
        parsed.error.issues.map((i: { message: string }) => i.message).join(", "),
      );
    }

    const { status } = parsed.data;

    const updated = await prisma.booking.update({
      where: { id },
      data: {
        status,
        ...(status === "CONFIRMED" && { paidAt: new Date() }),
      },
      select: {
        id:         true,
        ref:        true,
        status:     true,
        paidAt:     true,
        total:      true,
        updatedAt:  true,
      },
    });

    return ok(updated);
  } catch (e) {
    return serverError(e);
  }
}
