import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
// paypack-js is a CJS module that wraps the class as `module.exports = { default: Paypack }`.
// Turbopack resolves `import Paypack from "paypack-js"` to the outer object, not the class.
// We must destructure `.default` explicitly to get the constructor.
import PaypackModule from "paypack-js";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Paypack = (PaypackModule as any).default ?? PaypackModule;
import prisma from "../../../../../prisma/client";
import { ok, forbidden, badRequest, notFound, serverError } from "@/lib/api-utils";

// POST /api/payments/cashin
// Body: { bookingId: string; phone: string }
// Initiates a PayPack cashin and stores the paypackRef on the booking.
export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req });
    if (!token?.id) return forbidden("Authentication required");

    const body = await req.json() as { bookingId?: string; phone?: string };
    const { bookingId, phone } = body;

    if (!bookingId || typeof bookingId !== "string") {
      return badRequest("bookingId is required");
    }
    if (!phone || typeof phone !== "string") {
      return badRequest("phone is required");
    }

    // Normalise Rwanda phone to local 10-digit format (07XXXXXXXX).
    // Accept all of:
    //   +250791956434  →  0791956434
    //    250791956434  →  0791956434
    //      0791956434  →  0791956434  (already local)
    //       791956434  →  0791956434  (9 digits, no leading 0)
    const digits = phone.replace(/\D/g, "");
    let local = digits;
    if (local.startsWith("2507"))      local = "0" + local.slice(3);   // 2507XXXXXXX → 07XXXXXXX
    else if (local.startsWith("250"))  local = "0" + local.slice(3);   // 250XXXXXXXX → 0XXXXXXXXX
    else if (local.length === 9 && !local.startsWith("0")) local = "0" + local; // 7XXXXXXXX → 07XXXXXXX

    // PayPack accepts 078/079/075/073/072 (matches their own isPhoneNumber regex)
    if (!/^07[235789]\d{7}$/.test(local)) {
      return badRequest("Invalid phone number. Use MTN (078/079/075) or Airtel (072/073) Rwanda number.");
    }

    // Fetch booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        userId: true,
        status: true,
        total: true,
        method: true,
      },
    });
    if (!booking) return notFound("Booking not found");
    if (booking.userId !== (token.id as string)) return forbidden("Access denied");
    if (booking.status !== "PENDING") {
      return badRequest(`Booking is already ${booking.status}`);
    }

    // Initialise PayPack
    const paypack = new Paypack({
      client_id: process.env.PAYPACK_APPLICATION_ID!,
      client_secret: process.env.PAYPACK_APPLICATION_SECRET!,
    });

    // Convert USD → RWF before sending to PayPack (PayPack transacts in RWF)
    const rate = Number(process.env.USD_TO_RWF_RATE ?? "1450");
    const amountRwf = Math.round(booking.total * rate);

    // PayPack sandbox (Approved Numbers) requires environment: "development".
    // Pass the local format (07XXXXXXXX) — the sandbox lookup is keyed on the
    // same format stored in the Approved Numbers list, not the international one.
    const webhookMode =
      process.env.PAYPACK_WEBHOOK_MODE ??
      (process.env.NODE_ENV === "production" ? "production" : "development");

    console.log("[cashin] initiating:", {
      number: local,
      amountRwf,
      environment: webhookMode,
      bookingId,
    });

    let result: { data: { ref: string; status: string } };
    try {
      result = await paypack.cashin({
        amount: amountRwf,
        number: local,           // local format: 07XXXXXXXX (matches Approved Numbers list)
        environment: webhookMode,
      });
    } catch (paypackErr: unknown) {
      // Log the full error — PayPack throws the raw response body (plain object)
      // e.g. { message: "number not found for testing mode" }
      console.error(
        "[cashin] PayPack error (full):",
        JSON.stringify(paypackErr, Object.getOwnPropertyNames(paypackErr as object)),
      );
      let msg = "Payment initiation failed. Please try again.";
      if (
        paypackErr !== null &&
        typeof paypackErr === "object" &&
        "message" in paypackErr &&
        typeof (paypackErr as { message: unknown }).message === "string"
      ) {
        msg = (paypackErr as { message: string }).message;
      } else if (paypackErr instanceof Error) {
        msg = paypackErr.message;
      }
      return badRequest(msg);
    }

    const ref = result.data.ref;
    const initialStatus = (result.data.status ?? "").toUpperCase();

    console.log("[cashin] PayPack response:", JSON.stringify(result.data));

    // Store paypackRef and payerPhone on the booking
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        paypackRef: ref,
        payerPhone: local,
      },
    });

    // If PayPack immediately returned a terminal failure, settle the booking now
    if (initialStatus === "FAILED" || initialStatus === "CANCELLED") {
      const fullBooking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { lines: true },
      });
      if (fullBooking) {
        await prisma.$transaction([
          prisma.booking.update({ where: { id: bookingId }, data: { status: "FAILED" } }),
          prisma.ticket.updateMany({ where: { bookingId }, data: { status: "CANCELLED" } }),
          ...fullBooking.lines.map((line) =>
            prisma.ticketTier.update({
              where: { id: line.tierId },
              data: { remaining: { increment: line.qty } },
            }),
          ),
        ]);
      }
    }

    return ok({ ref, status: initialStatus || result.data.status });
  } catch (e) {
    return serverError(e);
  }
}
