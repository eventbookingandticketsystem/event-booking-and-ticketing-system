import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import prisma from "../../../../../prisma/client";
import {
  unauthorized,
  forbidden,
  serverError,
  paginated,
} from "@/lib/api-utils";
import { Prisma } from "@prisma/client";

// ── GET /api/organizer/events — ORGANIZER only ────────────────────────────
export async function GET(req: NextRequest) {
  try {
    // 1. Role check
    const token = await getToken({ req });
    if (!token?.id || token.role !== "ORGANIZER") {
      return unauthorized("Organizer access required");
    }

    // 2. Resolve organizer profile
    const orgProfile = await prisma.orgProfile.findUnique({
      where: { userId: token.id as string },
    });
    if (!orgProfile) return forbidden("Organizer profile not found");

    // 3. Query params
    const { searchParams } = req.nextUrl;
    const statusParam = searchParams.get("status") ?? undefined;
    const page  = Math.max(1, Number(searchParams.get("page")  ?? 1));
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 20)));
    const skip  = (page - 1) * limit;

    const where: Prisma.EventWhereInput = {
      orgProfileId: orgProfile.id,
      ...(statusParam && {
        status: statusParam as Prisma.EnumEventStatusFilter,
      }),
    };

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        skip,
        take:    limit,
        orderBy: { date: "desc" },
        include: {
          tiers: {
            select: {
              id:        true,
              name:      true,
              price:     true,
              capacity:  true,
              remaining: true,
              soldOut:   true,
              lowStock:  true,
            },
          },
          _count: {
            select: {
              bookings:   true,
              tickets:    true,
              gateAgents: true,
            },
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
