import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import PaypackModule from "paypack-js";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Paypack = (PaypackModule as any).default ?? PaypackModule;
import prisma from "../../../../../prisma/client";
import { ok, forbidden, badRequest, notFound, serverError } from "@/lib/api-utils";

// POST /api/payments/confirm
// Body: { bookingId: string }
// User-triggered: queries PayPack for the transaction result and settles
// the booking in the DB if the payment went through.
// This is the fallback for dev (no webhook delivery) and for users who
// want to manually check after dialling the USSD code.
export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req });
    if (!token?.id) return forbidden("Authentication required");

    const body = await req.json() as { bookingId?: string };
    const { bookingId } = body;

    if (!bookingId || typeof bookingId !== "string") {
      return badRequest("bookingId is required");
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        userId: true,
        status: true,
        ref: true,
        total: true,
        paypackRef: true,
        lines: { select: { tierId: true, qty: true } },
      },
    });

    if (!booking) return notFound("Booking not found");
    if (booking.userId !== (token.id as string)) return forbidden("Access denied");

    // Already settled — just return current status
    if (booking.status !== "PENDING") {
      return ok({ status: booking.status, ref: booking.ref });
    }

    if (!booking.paypackRef) {
      return badRequest("No payment reference found for this booking");
    }

    // Query PayPack for the live transaction status
    const paypack = new Paypack({
      client_id: process.env.PAYPACK_APPLICATION_ID!,
      client_secret: process.env.PAYPACK_APPLICATION_SECRET!,
    });

    let txStatus = "PENDING";
    try {
      const txResult = await paypack.transaction(booking.paypackRef);
      txStatus = (txResult?.data?.status ?? "").toUpperCase();
      console.log("[confirm] PayPack tx:", booking.paypackRef, "→", txStatus);
    } catch (paypackErr: unknown) {
      const errObj = paypackErr as { message?: string; status?: number };
      const msg = errObj?.message ?? "unknown";
      console.error("[confirm] PayPack error:", msg, JSON.stringify(paypackErr, Object.getOwnPropertyNames(paypackErr as object)));

      // "transaction not found" means PayPack has no record — treat as failed
      const lower = msg.toLowerCase();
      if (lower.includes("not found") || lower.includes("failed") || lower.includes("cancelled")) {
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
        return ok({ status: "FAILED", ref: booking.ref });
      }

      return badRequest("Could not reach payment provider. Please try again.");
    }

    if (txStatus === "SUCCESSFUL") {
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
      return ok({ status: "CONFIRMED", ref: booking.ref });
    }

    if (txStatus === "FAILED" || txStatus === "CANCELLED") {
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
      return ok({ status: "FAILED", ref: booking.ref });
    }

    // Transaction is still processing (PENDING / INITIATED / etc.)
    return ok({ status: "PENDING", ref: booking.ref });
  } catch (e) {
    return serverError(e);
  }
}
