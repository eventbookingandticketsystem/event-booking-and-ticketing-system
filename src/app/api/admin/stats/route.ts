import { NextRequest } from "next/server";
import prisma from "../../../../../prisma/client";
import { requireAdmin, unauthorized, ok, serverError } from "@/lib/api-utils";

// ── GET /api/admin/stats — ADMIN only ─────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const token = await requireAdmin(req);
    if (!token) return unauthorized("Admin access required");

    const now             = new Date();
    const thirtyDaysAgo  = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    // Run all aggregate queries in parallel
    const [
      totalOrganizers,
      activeToday,
      ticketsAllTime,
      fraud30d,
      recentTickets,
    ] = await Promise.all([
      prisma.user.count({ where: { role: "ORGANIZER" } }),

      prisma.event.count({ where: { status: "ONGOING" } }),

      prisma.ticket.count(),

      prisma.scanRecord.count({
        where: {
          result:    { not: "ADMIT" },
          scannedAt: { gte: thirtyDaysAgo },
        },
      }),

      // Fetch only the issuedAt timestamps for last 14 days
      prisma.ticket.findMany({
        where:  { issuedAt: { gte: fourteenDaysAgo } },
        select: { issuedAt: true },
      }),
    ]);

    // Build a map of "MMM DD" → count for the last 14 days
    const dayMap = new Map<string, number>();

    // Pre-fill all 14 days with 0 so gaps are included
    for (let i = 13; i >= 0; i--) {
      const d   = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
      dayMap.set(key, 0);
    }

    // Tally actual ticket counts
    for (const { issuedAt } of recentTickets) {
      const key = issuedAt.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
      dayMap.set(key, (dayMap.get(key) ?? 0) + 1);
    }

    const salesTrend = Array.from(dayMap.entries()).map(([t, v]) => ({ t, v }));

    return ok({
      totalOrganizers,
      activeToday,
      ticketsAllTime,
      fraud30d,
      salesTrend,
    });
  } catch (e) {
    return serverError(e);
  }
}
