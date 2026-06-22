import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import prisma from "../../../../../prisma/client";
import {
  ok,
  unauthorized,
  forbidden,
  notFound,
  badRequest,
  serverError,
} from "@/lib/api-utils";

// ── Bucket admit scans into 30-minute windows ──────────────────────────────
function buildEntryRate(
  scans: { scannedAt: Date }[],
): { t: string; v: number }[] {
  const bucketMap = new Map<string, number>();

  for (const { scannedAt } of scans) {
    const h   = scannedAt.getHours();
    const m   = scannedAt.getMinutes() < 30 ? 0 : 30;
    const key = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    bucketMap.set(key, (bucketMap.get(key) ?? 0) + 1);
  }

  // Sort by time label and return
  return Array.from(bucketMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([t, v]) => ({ t, v }));
}

// ── GET /api/organizer/dashboard?eventId=… — ORGANIZER only ───────────────
export async function GET(req: NextRequest) {
  try {
    // 1. Role check
    const token = await getToken({ req });
    if (!token?.id || token.role !== "ORGANIZER") {
      return unauthorized("Organizer access required");
    }

    // 2. Require eventId query param
    const { searchParams } = req.nextUrl;
    const eventId = searchParams.get("eventId");
    if (!eventId) return badRequest("eventId is required");

    // 3. Resolve organizer profile
    const orgProfile = await prisma.orgProfile.findUnique({
      where: { userId: token.id as string },
    });
    if (!orgProfile) return forbidden("Organizer profile not found");

    // 4. Fetch event with tiers
    const event = await prisma.event.findUnique({
      where:   { id: eventId },
      include: { tiers: true },
    });
    if (!event) return notFound("Event not found");

    // 5. Ownership check
    if (event.orgProfileId !== orgProfile.id) {
      return forbidden("You do not own this event");
    }

    // 6. Compute JS-side metrics from tiers
    const capacity = event.tiers.reduce((sum, t) => sum + t.capacity,  0);
    const sold     = event.tiers.reduce(
      (sum, t) => sum + (t.capacity - t.remaining), 0,
    );

    // 7. Parallel DB metrics
    const [
      admitted,
      fraud,
      revenueAgg,
      recentScans,
      admitScans,
    ] = await Promise.all([
      // a. USED tickets for this event
      prisma.ticket.count({
        where: { eventId, status: "USED" },
      }),

      // b. Non-ADMIT scan records
      prisma.scanRecord.count({
        where: { eventId, result: { not: "ADMIT" } },
      }),

      // c. Revenue from CONFIRMED booking lines
      prisma.bookingLine.aggregate({
        where: {
          booking: { eventId, status: "CONFIRMED" },
        },
        _sum: { subtotal: true },
      }),

      // d. Last 10 scan records
      prisma.scanRecord.findMany({
        where:   { eventId },
        orderBy: { scannedAt: "desc" },
        take:    10,
        select: {
          id:        true,
          result:    true,
          scannedAt: true,
          gate:      true,
          ticketRef: true,
        },
      }),

      // e. All ADMIT scans for entry-rate bucketing
      prisma.scanRecord.findMany({
        where:   { eventId, result: "ADMIT" },
        select:  { scannedAt: true },
        orderBy: { scannedAt: "asc" },
      }),
    ]);

    const revenue    = revenueAgg._sum.subtotal ?? 0;
    const entryRate  = buildEntryRate(admitScans);

    // 8. Tier breakdown (JS, no extra query)
    const tiersBreakdown = event.tiers.map((t) => ({
      name:      t.name,
      capacity:  t.capacity,
      sold:      t.capacity - t.remaining,
      remaining: t.remaining,
      soldOut:   t.soldOut,
    }));

    return ok({
      eventName: event.title,
      admitted,
      capacity,
      sold,
      fraud,
      revenue,
      entryRate,
      tiers: tiersBreakdown,
      scans: recentScans,
    });
  } catch (e) {
    return serverError(e);
  }
}
