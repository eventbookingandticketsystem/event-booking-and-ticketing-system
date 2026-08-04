import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import PaypackModule from "paypack-js";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Paypack = (PaypackModule as any).default ?? PaypackModule;
import Stripe from "stripe";
import prisma from "../../../../../../prisma/client";
import { ok, forbidden, notFound, serverError } from "@/lib/api-utils";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-07-29.dahlia",
});

// GET /api/payments/status/[bookingId]
// Returns the current booking status. When the booking is PENDING and has a
// paypackRef, it also queries PayPack live so that failures (sandbox or
// production) are reflected immediately without requiring a webhook delivery.
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
        paypackRef: true,
        lines: { select: { tierId: true, qty: true } },
      },
    });

    if (!booking) return notFound("Booking not found");
    if (booking.userId !== (token.id as string)) return forbidden("Access denied");

    // If already settled, return immediately
    if (booking.status !== "PENDING") {
      return ok({
        id: booking.id,
        ref: booking.ref,
        status: booking.status,
        paidAt: booking.paidAt,
        total: booking.total,
      });
    }

    if (!booking.paypackRef) {
      // No payment ref yet — still waiting
      return ok({ id: booking.id, ref: booking.ref, status: "PENDING", paidAt: null, total: booking.total });
    }

    // Detect Stripe vs PayPack by the ref prefix
    const isStripe = booking.paypackRef.startsWith("cs_");

    let liveStatus = "PENDING";

    if (isStripe) {
      // Check Stripe Checkout Session status
      try {
        const session = await stripe.checkout.sessions.retrieve(booking.paypackRef);
        console.log("[status] Stripe session:", session.id, "→ payment_status:", session.payment_status, "status:", session.status);
        if (session.payment_status === "paid") {
          liveStatus = "SUCCESSFUL";
        } else if (session.status === "expired") {
          liveStatus = "FAILED";
        }
        // "open" = still in checkout → keep PENDING
      } catch (stripeErr: unknown) {
        console.warn("[status] Stripe session query failed:", (stripeErr as { message?: string })?.message);
      }
    } else {
      // PayPack path
      try {
        const paypack = new Paypack({
          client_id: process.env.PAYPACK_APPLICATION_ID!,
          client_secret: process.env.PAYPACK_APPLICATION_SECRET!,
        });
        const txResult = await paypack.transaction(booking.paypackRef);
        liveStatus = (txResult?.data?.status ?? "PENDING").toUpperCase();
        console.log("[status] PayPack tx:", booking.paypackRef, "→", liveStatus);
      } catch (paypackErr: unknown) {
        const msg = (paypackErr as { message?: string })?.message ?? "";
        console.warn("[status] PayPack query failed:", msg);
        if (msg.toLowerCase().includes("not found")) liveStatus = "FAILED";
      }
    }

    if (liveStatus === "SUCCESSFUL") {
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
      return ok({ id: booking.id, ref: booking.ref, status: "CONFIRMED", paidAt: new Date(), total: booking.total });
    }

    if (liveStatus === "FAILED" || liveStatus === "CANCELLED") {
      await prisma.$transaction([
        prisma.booking.update({
          where: { id: booking.id },
          data: { status: "FAILED" },
        }),
        prisma.ticket.updateMany({
          where: { bookingId: booking.id },
          data: { status: "CANCELLED" },
        }),
        ...booking.lines.map((line) =>
          prisma.ticketTier.update({
            where: { id: line.tierId },
            data: { remaining: { increment: line.qty } },
          }),
        ),
      ]);
      return ok({ id: booking.id, ref: booking.ref, status: "FAILED", paidAt: null, total: booking.total });
    }

    // Still genuinely pending (INITIATED / PROCESSING / etc.)
    return ok({
      id: booking.id,
      ref: booking.ref,
      status: "PENDING",
      paidAt: null,
      total: booking.total,
    });
  } catch (e) {
    return serverError(e);
  }
}
