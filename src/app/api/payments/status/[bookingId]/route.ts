import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import prisma from "../../../../../../prisma/client";
import { ok, forbidden, notFound, serverError } from "@/lib/api-utils";

// GET /api/payments/status/[bookingId]
// Returns the current booking status for polling on the payment page.
// This endpoint only reads the DB — it never calls PayPack directly.
// Confirmation happens via webhook (production) or the manual /api/payments/confirm
// endpoint that the user triggers from the payment page.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> },
) {
  try {
    const token = await getToken({ req });
    if (!token?.id) return forbidden("Authentication required");

    const { bookingId } = await params;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        userId: true,
        status: true,
        paidAt: true,
        ref: true,
        total: true,
      },
    });

    if (!booking) return notFound("Booking not found");
    if (booking.userId !== (token.id as string)) return forbidden("Access denied");

    return ok({
      id: booking.id,
      ref: booking.ref,
      status: booking.status,
      paidAt: booking.paidAt,
      total: booking.total,
    });
  } catch (e) {
    return serverError(e);
  }
}
