import { NextRequest } from "next/server";
import prisma from "../../../../../prisma/client";
import { ok, serverError } from "@/lib/api-utils";

// ── Release thresholds ────────────────────────────────────────────────────────
//
//  Normal:       PENDING booking older than 2 days → EXPIRED
//  Near-event:   If the event starts within 24 hours, release after 2 hours
//                (so seats don't stay locked right before the event)
//
// Called by:
//   • Vercel cron  (POST /api/bookings/cleanup — CRON_SECRET header)
//   • Lazily on wallet load (GET /api/bookings/mine triggers this internally)
//
// Security: protected by CRON_SECRET env var.
// Set CRON_SECRET to a strong random string and configure the same value in
// Vercel → Settings → Environment Variables.

const NORMAL_TTL_MS     = 2 * 24 * 60 * 60 * 1000; // 2 days
const NEAR_EVENT_TTL_MS =     2 * 60 * 60 * 1000;  // 2 hours
const NEAR_EVENT_WINDOW =    24 * 60 * 60 * 1000;  // event within 24h → near

// Auth check shared by both GET (Vercel cron) and POST (manual trigger)
function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // dev: no secret configured → allow

  // Vercel cron sends x-vercel-cron: 1 and the secret as Authorization
  const vercelCron = req.headers.get("x-vercel-cron");
  if (vercelCron === "1") return true;

  const auth = req.headers.get("authorization") ?? "";
  return auth === `Bearer ${secret}`;
}

async function runCleanup() {
  const now = new Date();

  const pending = await prisma.booking.findMany({
    where: { status: "PENDING" },
    select: {
      id:        true,
      createdAt: true,
      event: { select: { date: true } },
      lines: {
        select: { tierId: true, qty: true },
      },
    },
  });

  const toExpire: string[] = [];

  for (const booking of pending) {
    const age = now.getTime() - booking.createdAt.getTime();
    const eventDate = new Date(booking.event.date);
    const timeUntilEvent = eventDate.getTime() - now.getTime();

    const isNearEvent = timeUntilEvent <= NEAR_EVENT_WINDOW;
    const ttl = isNearEvent ? NEAR_EVENT_TTL_MS : NORMAL_TTL_MS;

    if (age >= ttl) toExpire.push(booking.id);
  }

  if (toExpire.length === 0) return { expired: 0, message: "Nothing to expire" };

  const expiredBookings = pending.filter((b) => toExpire.includes(b.id));

  await prisma.$transaction(async (tx) => {
    await tx.booking.updateMany({
      where: { id: { in: toExpire } },
      data:  { status: "EXPIRED" },
    });
    await tx.ticket.updateMany({
      where: { bookingId: { in: toExpire } },
      data:  { status: "CANCELLED" },
    });

    const tierDeltas = new Map<string, number>();
    for (const booking of expiredBookings) {
      for (const line of booking.lines) {
        tierDeltas.set(line.tierId, (tierDeltas.get(line.tierId) ?? 0) + line.qty);
      }
    }
    for (const [tierId, delta] of tierDeltas) {
      const tier = await tx.ticketTier.findUnique({
        where:  { id: tierId },
        select: { capacity: true, remaining: true },
      });
      if (!tier) continue;
      const newRemaining = Math.min(tier.capacity, tier.remaining + delta);
      await tx.ticketTier.update({
        where: { id: tierId },
        data: {
          remaining: newRemaining,
          soldOut:   false,
          lowStock:  newRemaining / tier.capacity < 0.1,
        },
      });
    }
  });

  console.log(`[cleanup] Expired ${toExpire.length} stale bookings`);
  return { expired: toExpire.length, ids: toExpire };
}

// GET — called by Vercel cron scheduler
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { "Content-Type": "application/json" },
    });
  }
  try {
    const result = await runCleanup();
    return ok(result);
  } catch (e) {
    return serverError(e);
  }
}

// POST — manual trigger (e.g. from admin panel or local dev)
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { "Content-Type": "application/json" },
    });
  }
  try {
    const result = await runCleanup();
    return ok(result);
  } catch (e) {
    return serverError(e);
  }
}
