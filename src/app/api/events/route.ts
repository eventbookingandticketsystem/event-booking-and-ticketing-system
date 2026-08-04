import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import prisma from "../../../../prisma/client";
import {
  ok,
  created,
  badRequest,
  forbidden,
  serverError,
  paginated,
} from "@/lib/api-utils";
import { createEventSchema } from "@/lib/validation/event.schemas";
import { Prisma } from "@prisma/client";

// ── Shared tier select shape ───────────────────────────────────────────────
const tierSelect = {
  id:        true,
  name:      true,
  price:     true,
  remaining: true,
  soldOut:   true,
  lowStock:  true,
  capacity:  true,
} satisfies Prisma.TicketTierSelect;

const orgProfileSelect = {
  id:          true,
  orgName:     true,
  contactName: true,
} satisfies Prisma.OrgProfileSelect;

// ── GET /api/events — public ───────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;

    const category  = searchParams.get("category")  ?? undefined;
    const statusParam = searchParams.get("status")   ?? undefined;
    const featured  = searchParams.get("featured") === "true" ? true : undefined;
    const city      = searchParams.get("city")       ?? undefined;
    const search    = searchParams.get("search")     ?? undefined;
    const page      = Math.max(1, Number(searchParams.get("page")  ?? 1));
    const limit     = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 12)));
    const skip      = (page - 1) * limit;

    // Public-facing events must never include DRAFT or CANCELLED.
    // When no status param is given, exclude both. When a specific status is
    // requested, honour it (used by organizer/admin views via this shared route).
    const statusWhere: Prisma.EventWhereInput["status"] = statusParam
      ? (statusParam as Prisma.EnumEventStatusFilter)
      : { notIn: ["DRAFT", "CANCELLED"] };

    // For public listing (no explicit status param) hide events whose date has passed.
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateWhere: Prisma.EventWhereInput =
      !statusParam ? { date: { gte: today } } : {};

    const where: Prisma.EventWhereInput = {
      status: statusWhere,
      ...dateWhere,
      ...(category  && { category }),
      ...(featured  && { featured }),
      ...(city      && { city }),
      ...(search    && {
        title: { contains: search, mode: "insensitive" as Prisma.QueryMode },
      }),
    };

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        skip,
        take:    limit,
        orderBy: { date: "asc" },
        include: {
          tiers:      { select: tierSelect },
          orgProfile: { select: orgProfileSelect },
        },
      }),
      prisma.event.count({ where }),
    ]);

    return paginated(events, page, limit, total);
  } catch (e) {
    return serverError(e);
  }
}

// ── POST /api/events — ORGANIZER only ─────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req });
    if (!token?.id) {
      return forbidden("Sign in to create events");
    }
    if (token.role !== "ORGANIZER" && token.role !== "ADMIN") {
      return forbidden("Only organizers can create events");
    }

    const body   = await req.json();
    const parsed = createEventSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(
        parsed.error.issues.map((i: { message: string }) => i.message).join(", "),
      );
    }

    const { tiers, ...eventFields } = parsed.data;

    // Resolve orgProfile
    const orgProfile = await prisma.orgProfile.findUnique({
      where: { userId: token.id as string },
    });
    if (!orgProfile) {
      return forbidden("Organizer profile not found");
    }

    const event = await prisma.event.create({
      data: {
        ...eventFields,
        date:        new Date(eventFields.date),
        organizer:   orgProfile.orgName,
        orgProfileId: orgProfile.id,
        tiers: {
          create: tiers.map((t) => ({
            name:       t.name,
            price:      t.price,
            capacity:   t.capacity,
            remaining:  t.capacity,   // starts full
            soldOut:    false,
            lowStock:   false,
            saleOpens:  t.saleOpens  ? new Date(t.saleOpens)  : undefined,
            saleCloses: t.saleCloses ? new Date(t.saleCloses) : undefined,
          })),
        },
      },
      include: {
        tiers:      true,
        orgProfile: { select: orgProfileSelect },
      },
    });

    return created(event);
  } catch (e) {
    return serverError(e);
  }
}
