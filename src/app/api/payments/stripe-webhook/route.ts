import { NextRequest } from "next/server";
import Stripe from "stripe";
import prisma from "../../../../../prisma/client";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-07-29.dahlia",
});

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const sig = req.headers.get("stripe-signature") ?? "";

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error("[stripe-webhook] signature verification failed:", err);
    return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const bookingId = session.metadata?.bookingId;
    if (!bookingId) return new Response(JSON.stringify({ ok: true }), { status: 200 });

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { lines: true },
    });

    if (booking && booking.status === "PENDING") {
      await prisma.$transaction([
        prisma.booking.update({
          where: { id: bookingId },
          data: { status: "CONFIRMED", paidAt: new Date(), paypackRef: session.payment_intent as string },
        }),
        prisma.ticket.updateMany({
          where: { bookingId },
          data: { status: "VALID" },
        }),
      ]);
      console.log("[stripe-webhook] booking confirmed:", bookingId);
    }
  }

  if (event.type === "checkout.session.expired" || event.type === "payment_intent.payment_failed") {
    const obj = event.data.object as { metadata?: { bookingId?: string }; id?: string };
    const bookingId = obj.metadata?.bookingId;
    if (!bookingId) return new Response(JSON.stringify({ ok: true }), { status: 200 });

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { lines: true },
    });

    if (booking && booking.status === "PENDING") {
      await prisma.$transaction([
        prisma.booking.update({ where: { id: bookingId }, data: { status: "FAILED" } }),
        prisma.ticket.updateMany({ where: { bookingId }, data: { status: "CANCELLED" } }),
        ...booking.lines.map((line) =>
          prisma.ticketTier.update({
            where: { id: line.tierId },
            data: { remaining: { increment: line.qty } },
          })
        ),
      ]);
      console.log("[stripe-webhook] booking failed:", bookingId);
    }
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
}
