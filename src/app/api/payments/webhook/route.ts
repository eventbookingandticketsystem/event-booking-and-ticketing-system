import { NextRequest } from "next/server";
import crypto from "crypto";
import prisma from "../../../../../prisma/client";

// POST /api/payments/webhook
// Called by PayPack when a cashin transaction completes.
// Verifies HMAC-SHA256 signature, then marks booking CONFIRMED or FAILED.
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-paypack-signature") ?? "";

    // Validate webhook signature
    const secret = process.env.PAYPACK_WEBHOOK_SECRET ?? "";
    if (secret) {
      const expected = crypto
        .createHmac("sha256", secret)
        .update(rawBody)
        .digest("hex");
      const sigBuf = Buffer.from(signature);
      const expBuf = Buffer.from(expected);
      // timingSafeEqual requires equal lengths — reject immediately if they differ
      const valid =
        sigBuf.length === expBuf.length &&
        crypto.timingSafeEqual(sigBuf, expBuf);
      if (!valid) {
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const event = JSON.parse(rawBody) as any;

    // PayPack event shape: { event_kind, data: { ref, status, kind, ... } }
    const kind: string = event?.event_kind ?? "";
    const txRef: string = event?.data?.ref ?? "";
    const status: string = (event?.data?.status ?? "").toUpperCase();

    if (!txRef) {
      return new Response(JSON.stringify({ ok: true, note: "no ref" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Find booking by paypackRef
    const booking = await prisma.booking.findFirst({
      where: { paypackRef: txRef },
      select: { id: true, status: true, tickets: { select: { id: true } } },
    });

    if (!booking || booking.status !== "PENDING") {
      return new Response(JSON.stringify({ ok: true, note: "not found or not pending" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (kind === "payment:cashin" && status === "SUCCESSFUL") {
      // Confirm booking and mark all tickets VALID
      await prisma.$transaction([
        prisma.booking.update({
          where: { id: booking.id },
          data: { status: "CONFIRMED", paidAt: new Date() },
        }),
        prisma.ticket.updateMany({
          where: { bookingId: booking.id },
          data: { status: "VALID" },
        }),
      ]);
    } else if (status === "FAILED" || status === "CANCELLED") {
      // Mark booking FAILED and release tier capacity (tickets stay CANCELLED)
      const fullBooking = await prisma.booking.findUnique({
        where: { id: booking.id },
        include: { lines: true },
      });
      if (fullBooking) {
        await prisma.$transaction([
          prisma.booking.update({
            where: { id: booking.id },
            data: { status: "FAILED" },
          }),
          prisma.ticket.updateMany({
            where: { bookingId: booking.id },
            data: { status: "CANCELLED" },
          }),
          // Restore remaining counts on each tier
          ...fullBooking.lines.map((line) =>
            prisma.ticketTier.update({
              where: { id: line.tierId },
              data: { remaining: { increment: line.qty } },
            })
          ),
        ]);
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[webhook] error:", e);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
