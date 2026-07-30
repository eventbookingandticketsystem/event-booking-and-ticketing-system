import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import Stripe from "stripe";
import prisma from "../../../../../prisma/client";
import { ok, badRequest, forbidden, notFound, serverError } from "@/lib/api-utils";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-07-29.dahlia",
});

const USD_TO_RWF = Number(process.env.USD_TO_RWF_RATE ?? "1450");

// POST /api/payments/stripe-session
// Body: { bookingId: string }
// Creates a Stripe Checkout Session and returns the session URL.
export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req });
    if (!token?.id) return forbidden("Authentication required");

    const body = await req.json() as { bookingId?: string };
    const { bookingId } = body;
    if (!bookingId) return badRequest("bookingId is required");

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        event: { select: { title: true, date: true, image: true } },
        lines: {
          include: { tier: { select: { name: true } } },
        },
      },
    });

    if (!booking) return notFound("Booking not found");
    if (booking.userId !== (token.id as string)) return forbidden("Access denied");
    if (booking.status !== "PENDING") return badRequest(`Booking is already ${booking.status}`);

    const baseUrl = process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

    // Build line items from booking lines
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = booking.lines.map((line) => ({
      price_data: {
        currency: "usd",
        unit_amount: Math.round(line.unitPrice * 100), // cents
        product_data: {
          name: `${booking.event.title} — ${line.tier.name}`,
          description: booking.event.date ? String(booking.event.date) : undefined,
          ...(booking.event.image ? { images: [booking.event.image] } : {}),
        },
      },
      quantity: line.qty,
    }));

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      success_url: `${baseUrl}/dashboard/confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/dashboard/payment/${booking.event ? bookingId : bookingId}?cancelled=1`,
      metadata: {
        bookingId,
        userId: token.id as string,
      },
      payment_intent_data: {
        metadata: { bookingId, userId: token.id as string },
      },
    });

    console.log("[stripe-session] created:", session.id, "for booking:", bookingId);

    return ok({ sessionId: session.id, url: session.url });
  } catch (e) {
    return serverError(e);
  }
}
