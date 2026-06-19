import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import prisma from "../../../../prisma/client";
import {
  ok,
  created,
  forbidden,
  notFound,
  badRequest,
  serverError,
  paginated,
} from "@/lib/api-utils";
import { createAgentSchema } from "@/lib/validation/agent.schemas";
import { Prisma } from "@prisma/client";

// ── GET /api/agents — ORGANIZER or ADMIN ──────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req });
    if (!token?.id) return forbidden("Authentication required");

    if (token.role !== "ORGANIZER" && token.role !== "ADMIN") {
      return forbidden("Organizer or Admin access required");
    }

    const { searchParams } = req.nextUrl;
    const eventIdParam = searchParams.get("eventId") ?? undefined;
    const statusParam  = searchParams.get("status")  ?? undefined;
    const page  = Math.max(1, Number(searchParams.get("page")  ?? 1));
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 20)));
    const skip  = (page - 1) * limit;

    // Role-based ownership filter
    let ownerFilter: Prisma.GateAgentWhereInput = {};
    if (token.role === "ORGANIZER") {
      ownerFilter = {
        event: { orgProfile: { userId: token.id as string } },
      };
    }
    // ADMIN: no extra filter

    const where: Prisma.GateAgentWhereInput = {
      ...ownerFilter,
      ...(eventIdParam && { eventId: eventIdParam }),
      ...(statusParam  && { status: statusParam as Prisma.EnumAgentStatusFilter }),
    };

    const [agents, total] = await Promise.all([
      prisma.gateAgent.findMany({
        where,
        skip,
        take:    limit,
        orderBy: { createdAt: "desc" },
        include: {
          event: {
            select: { id: true, title: true, date: true },
          },
        },
      }),
      prisma.gateAgent.count({ where }),
    ]);

    return paginated(agents, page, limit, total);
  } catch (e) {
    return serverError(e);
  }
}

// ── POST /api/agents — ORGANIZER only ─────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req });
    if (!token?.id) return forbidden("Authentication required");

    if (token.role !== "ORGANIZER") {
      return forbidden("Organizer access required");
    }

    const body   = await req.json();
    const parsed = createAgentSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(
        parsed.error.issues.map((i: { message: string }) => i.message).join(", "),
      );
    }

    const { name, phone, gate, eventId } = parsed.data;

    // 1. Resolve organizer's profile
    const orgProfile = await prisma.orgProfile.findUnique({
      where: { userId: token.id as string },
    });
    if (!orgProfile) return forbidden("Organizer profile not found");

    // 2. Find the event
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });
    if (!event) return notFound("Event not found");

    // 3. Verify ownership
    if (event.orgProfileId !== orgProfile.id) {
      return forbidden("You do not own this event");
    }

    // 4. Create the gate agent
    const agent = await prisma.gateAgent.create({
      data: { name, phone, gate, eventId, status: "ACTIVE" },
      include: {
        event: { select: { id: true, title: true, date: true } },
      },
    });

    return created(agent);
  } catch (e) {
    return serverError(e);
  }
}
