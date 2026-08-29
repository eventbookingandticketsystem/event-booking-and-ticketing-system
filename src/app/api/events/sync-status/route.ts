import { NextRequest } from "next/server";
import prisma from "../../../../../prisma/client";
import { ok, serverError } from "@/lib/api-utils";
import { startOfDay, endOfDay } from "@/lib/event-day";

// ── Daily event-status sync ────────────────────────────────────────────────
//
// An event is ONGOING for its entire calendar day (Event.date's local day),
// and COMPLETED from the day after. This job keeps the stored `status`
// column in sync with that policy so admin/organizer filters and stats
// that read `status` directly stay correct without needing to re-derive
// the date math themselves everywhere.
//
// Transitions:
//   PUBLISHED → ONGOING    when the event's day is today
//   ONGOING   → COMPLETED  when the event's day is in the past
//   PUBLISHED → COMPLETED  when the event's day is in the past (event was
//                          never manually marked ONGOING, e.g. small/unattended events)
//
// DRAFT and CANCELLED are never touched by this job — those are terminal/
// manual states an admin or organizer controls directly.
//
// Called by:
//   • Vercel cron  (GET  /api/events/sync-status — CRON_SECRET header, runs daily at 00:00)
//   • Manual/local (POST /api/events/sync-status — same CRON_SECRET check)
//
// Security: protected by CRON_SECRET env var (see bookings/cleanup for the
// same pattern).

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // dev: no secret configured → allow

  const vercelCron = req.headers.get("x-vercel-cron");
  if (vercelCron === "1") return true;

  const auth = req.headers.get("authorization") ?? "";
  return auth === `Bearer ${secret}`;
}

async function runSync() {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd    = endOfDay(now);

  const [toOngoing, toCompleted] = await Promise.all([
    prisma.event.updateMany({
      where: {
        status: "PUBLISHED",
        date:   { gte: todayStart, lte: todayEnd },
      },
      data: { status: "ONGOING" },
    }),

    prisma.event.updateMany({
      where: {
        status: { in: ["PUBLISHED", "ONGOING"] },
        date:   { lt: todayStart },
      },
      data: { status: "COMPLETED" },
    }),
  ]);

  console.log(
    `[sync-status] ${toOngoing.count} event(s) → ONGOING, ${toCompleted.count} event(s) → COMPLETED`,
  );

  return { toOngoing: toOngoing.count, toCompleted: toCompleted.count };
}

// GET — called by Vercel cron scheduler
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { "Content-Type": "application/json" },
    });
  }
  try {
    const result = await runSync();
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
    const result = await runSync();
    return ok(result);
  } catch (e) {
    return serverError(e);
  }
}
