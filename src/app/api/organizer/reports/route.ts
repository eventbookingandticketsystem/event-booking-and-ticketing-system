import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import prisma from "../../../../../prisma/client";
import {
  ok, unauthorized, forbidden, notFound, badRequest, serverError,
} from "@/lib/api-utils";

function buildEntryRate(scans: { scannedAt: Date }[]): { t: string; v: number }[] {
  const map = new Map<string, number>();
  for (const { scannedAt } of scans) {
    const h   = scannedAt.getHours();
    const m   = scannedAt.getMinutes() < 30 ? 0 : 30;
    const key = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([t, v]) => ({ t, v }));
}

function formatDuration(ms: number): string {
  if (ms <= 0) return "—";
  const totalMins = Math.floor(ms / 60_000);
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

/** GET /api/organizer/reports?eventId=… */
export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req });
    if (!token?.id || token.role !== "ORGANIZER") return unauthorized();

    const eventId = req.nextUrl.searchParams.get("eventId");
    if (!eventId) return badRequest("eventId is required");

    const orgProfile = await prisma.orgProfile.findUnique({
      where: { userId: token.id as string },
    });
    if (!orgProfile) return forbidden("Organizer profile not found");

    const event = await prisma.event.findUnique({
      where:   { id: eventId },
      include: { tiers: true },
    });
    if (!event) return notFound("Event not found");
    if (event.orgProfileId !== orgProfile.id) return forbidden("You do not own this event");

    const [
      admitScans,
      fraudScans,
      revenueAgg,
    ] = await Promise.all([
      // All ADMIT scans — for entry rate + duration
      prisma.scanRecord.findMany({
        where:   { eventId, result: "ADMIT" },
        select:  { scannedAt: true },
        orderBy: { scannedAt: "asc" },
      }),

      // All non-ADMIT scans — for fraud table
      prisma.scanRecord.findMany({
        where:   { eventId, result: { not: "ADMIT" } },
        select:  { scannedAt: true, gate: true, result: true, ticketRef: true },
        orderBy: { scannedAt: "desc" },
        take:    50,
      }),

      // Revenue from confirmed bookings
      prisma.bookingLine.aggregate({
        where: { booking: { eventId, status: "CONFIRMED" } },
        _sum:  { subtotal: true },
      }),
    ]);

    // Scan duration: first to last ADMIT scan
    const firstScan = admitScans[0]?.scannedAt ?? null;
    const lastScan  = admitScans[admitScans.length - 1]?.scannedAt ?? null;
    const durationMs = firstScan && lastScan
      ? lastScan.getTime() - firstScan.getTime()
      : 0;

    const attended = admitScans.length;
    const revenue  = revenueAgg._sum.subtotal ?? 0;

    const entryRate = buildEntryRate(admitScans);

    const tiers = event.tiers.map((t) => ({
      name:      t.name,
      capacity:  t.capacity,
      sold:      t.capacity - t.remaining,
      remaining: t.remaining,
      soldOut:   t.soldOut,
    }));

    const fraudRows = fraudScans.map((s) => ({
      time:      s.scannedAt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      gate:      s.gate ?? "—",
      reason:    s.result,          // "USED" | "INVALID" | "WRONG_EVENT" | "EXPIRED" | "REJECT"
      ticketRef: s.ticketRef ?? "—",
    }));

    return ok({
      eventName:  event.title,
      attended,
      revenue,
      fraud:      fraudScans.length,
      duration:   formatDuration(durationMs),
      entryRate,
      tiers,
      fraudRows,
    });
  } catch (e) {
    return serverError(e);
  }
}
