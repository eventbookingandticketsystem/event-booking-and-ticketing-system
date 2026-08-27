import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import prisma from "../../../../../prisma/client";
import {
  ok,
  unauthorized,
  forbidden,
  notFound,
  serverError,
} from "@/lib/api-utils";

type Tier = { id: string; name: string; capacity: number; remaining: number; soldOut: boolean };

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

// ── Merge per-tier capacity/sold across events by tier name ────────────────
function mergeTiers(tiers: Tier[]) {
  const byName = new Map<string, { capacity: number; sold: number; remaining: number; soldOut: boolean }>();

  for (const t of tiers) {
    const sold = t.capacity - t.remaining;
    const existing = byName.get(t.name);
    if (existing) {
      existing.capacity  += t.capacity;
      existing.sold      += sold;
      existing.remaining += t.remaining;
      existing.soldOut    = existing.soldOut && t.soldOut;
    } else {
      byName.set(t.name, { capacity: t.capacity, sold, remaining: t.remaining, soldOut: t.soldOut });
    }
  }

  return Array.from(byName.entries()).map(([name, v]) => ({ name, ...v }));
}

// ── Fetch dashboard metrics for a given event filter (single event or all owned events) ──
async function fetchDashboardMetrics(eventFilter: { eventId?: string; eventIds?: string[] }) {
  const where = eventFilter.eventId
    ? { eventId: eventFilter.eventId }
    : { eventId: { in: eventFilter.eventIds! } };
  const bookingWhere = eventFilter.eventId
    ? { eventId: eventFilter.eventId }
    : { eventId: { in: eventFilter.eventIds! } };

  const [
    admitted,
    fraud,
    revenueAgg,
    recentScans,
    admitScans,
  ] = await Promise.all([
    prisma.ticket.count({
      where: { ...where, status: "USED" },
    }),

    prisma.scanRecord.count({
      where: { ...where, result: { not: "ADMIT" } },
    }),

    prisma.bookingLine.aggregate({
      where: {
        booking: { ...bookingWhere, status: "CONFIRMED" },
      },
      _sum: { subtotal: true },
    }),

    prisma.scanRecord.findMany({
      where:   where,
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

    prisma.scanRecord.findMany({
      where:   { ...where, result: "ADMIT" },
      select:  { scannedAt: true },
      orderBy: { scannedAt: "asc" },
    }),
  ]);

  return {
    admitted,
    fraud,
    revenue:   revenueAgg._sum.subtotal ?? 0,
    entryRate: buildEntryRate(admitScans),
    scans:     recentScans,
  };
}

// ── GET /api/organizer/dashboard[?eventId=…] — ORGANIZER only ─────────────
// Omitting eventId returns an aggregate overview across all of the
// organizer's events.
export async function GET(req: NextRequest) {
  try {
    // 1. Role check
    const token = await getToken({ req });
    if (!token?.id || token.role !== "ORGANIZER") {
      return unauthorized("Organizer access required");
    }

    const { searchParams } = req.nextUrl;
    const eventId = searchParams.get("eventId");

    // 2. Resolve organizer profile
    const orgProfile = await prisma.orgProfile.findUnique({
      where: { userId: token.id as string },
    });
    if (!orgProfile) return forbidden("Organizer profile not found");

    // ── Single event ──────────────────────────────────────────────────────
    if (eventId) {
      const event = await prisma.event.findUnique({
        where:   { id: eventId },
        include: { tiers: true },
      });
      if (!event) return notFound("Event not found");

      if (event.orgProfileId !== orgProfile.id) {
        return forbidden("You do not own this event");
      }

      const capacity = event.tiers.reduce((sum, t) => sum + t.capacity, 0);
      const sold     = event.tiers.reduce((sum, t) => sum + (t.capacity - t.remaining), 0);
      const metrics  = await fetchDashboardMetrics({ eventId });

      const tiersBreakdown = event.tiers.map((t) => ({
        name:      t.name,
        capacity:  t.capacity,
        sold:      t.capacity - t.remaining,
        remaining: t.remaining,
        soldOut:   t.soldOut,
      }));

      return ok({
        eventId:   event.id,
        eventName: event.title,
        capacity,
        sold,
        tiers: tiersBreakdown,
        ...metrics,
      });
    }

    // ── All events overview ──────────────────────────────────────────────
    const events = await prisma.event.findMany({
      where:   { orgProfileId: orgProfile.id },
      include: { tiers: true },
    });

    if (events.length === 0) {
      return ok({
        eventId:   null,
        eventName: "All events",
        capacity:  0,
        sold:      0,
        admitted:  0,
        fraud:     0,
        revenue:   0,
        entryRate: [],
        tiers:     [],
        scans:     [],
      });
    }

    const eventIds = events.map((e) => e.id);
    const capacity = events.reduce(
      (sum, e) => sum + e.tiers.reduce((s, t) => s + t.capacity, 0), 0,
    );
    const sold = events.reduce(
      (sum, e) => sum + e.tiers.reduce((s, t) => s + (t.capacity - t.remaining), 0), 0,
    );
    const metrics = await fetchDashboardMetrics({ eventIds });
    const tiersBreakdown = mergeTiers(events.flatMap((e) => e.tiers));

    return ok({
      eventId:   null,
      eventName: "All events",
      capacity,
      sold,
      tiers: tiersBreakdown,
      ...metrics,
    });
  } catch (e) {
    return serverError(e);
  }
}
