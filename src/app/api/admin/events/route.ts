import { NextRequest } from "next/server";
import prisma from "../../../../../prisma/client";
import { requireAdmin, unauthorized, serverError, paginated } from "@/lib/api-utils";
import { Prisma } from "@prisma/client";
import { startOfDay, endOfDay } from "@/lib/event-day";

// ── GET /api/admin/events — ADMIN only ────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const token = await requireAdmin(req);
    if (!token) return unauthorized("Admin access required");

    const { searchParams } = req.nextUrl;
    const statusParam = searchParams.get("status") ?? undefined;
    const search      = searchParams.get("search") ?? undefined;
    const page  = Math.max(1, Number(searchParams.get("page")  ?? 1));
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 10)));
    const skip  = (page - 1) * limit;

    // "Ongoing" is derived from the date column (today's calendar day),
    // not the stored status — correct even between daily cron runs.
    const isOngoingFilter = statusParam === "ONGOING";
    const now = new Date();

    const where: Prisma.EventWhereInput = {
      ...(isOngoingFilter && {
        status: { in: ["PUBLISHED", "ONGOING"] },
        date:   { gte: startOfDay(now), lte: endOfDay(now) },
      }),
      ...(statusParam && !isOngoingFilter && { status: statusParam as Prisma.EnumEventStatusFilter }),
      ...(search && {
        title: { contains: search, mode: "insensitive" },
      }),
    };

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        skip,
        take:    limit,
        orderBy: { createdAt: "desc" },
        select: {
          id:          true,
          title:       true,
          description: true,
          venue:       true,
          city:        true,
          date:        true,
          time:        true,
          category:    true,
          poster:      true,
          status:      true,
          flagged:     true,
          organizer:   true,
          orgProfileId: true,
          createdAt:   true,
          updatedAt:   true,
          orgProfile: {
            select: { id: true, orgName: true, contactName: true },
          },
          _count: {
            select: { tiers: true, bookings: true, tickets: true },
          },
        },
      }),
      prisma.event.count({ where }),
    ]);

    return paginated(events, page, limit, total);
  } catch (e) {
    return serverError(e);
  }
}
