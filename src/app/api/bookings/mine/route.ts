import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import prisma from "../../../../../prisma/client";
import { ok, forbidden, serverError } from "@/lib/api-utils";

// GET /api/bookings/mine
// Returns all bookings for the authenticated user, newest first.
// Includes embedded event summary and per-booking ticket list.
// Used by the attendee wallet to show all booking states
// (CONFIRMED, PENDING, FAILED, EXPIRED) with retry / view-QR CTAs.
export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req });
    if (!token?.id) return forbidden("Authentication required");

    const bookings = await prisma.booking.findMany({
      where: { userId: token.id as string },
      orderBy: { createdAt: "desc" },
      include: {
        event: {
          select: {
            id:       true,
            title:    true,
            date:     true,
            venue:    true,
            category: true,
            poster:   true,
            city:     true,
          },
        },
        lines: {
          select: {
            id:        true,
            qty:       true,
            unitPrice: true,
            subtotal:  true,
            tier: {
              select: { id: true, name: true },
            },
          },
        },
        tickets: {
          select: {
            id:        true,
            ticketRef: true,
            status:    true,
            tier:      true,
          },
        },
      },
    });

    return ok(bookings);
  } catch (e) {
    return serverError(e);
  }
}
