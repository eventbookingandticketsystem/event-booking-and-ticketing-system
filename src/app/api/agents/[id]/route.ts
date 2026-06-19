import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import prisma from "../../../../../prisma/client";
import {
  ok,
  forbidden,
  notFound,
  badRequest,
  serverError,
} from "@/lib/api-utils";
import { updateAgentSchema } from "@/lib/validation/agent.schemas";

// ── Ownership helpers ──────────────────────────────────────────────────────
async function resolveAgent(agentId: string) {
  return prisma.gateAgent.findUnique({
    where: { id: agentId },
    include: {
      event: {
        include: {
          orgProfile: { select: { userId: true, id: true } },
        },
      },
    },
  });
}

type ResolvedAgent = NonNullable<Awaited<ReturnType<typeof resolveAgent>>>;

function isOwnerOrAdmin(
  agent: ResolvedAgent,
  tokenId: string,
  tokenRole: unknown,
): boolean {
  if (tokenRole === "ADMIN") return true;
  return agent.event.orgProfile?.userId === tokenId;
}

// ── GET /api/agents/[id] — ORGANIZER or ADMIN ─────────────────────────────
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token = await getToken({ req });
    if (!token?.id) return forbidden("Authentication required");

    if (token.role !== "ORGANIZER" && token.role !== "ADMIN") {
      return forbidden("Organizer or Admin access required");
    }

    const { id } = await params;

    const agent = await prisma.gateAgent.findUnique({
      where: { id },
      include: {
        event: {
          select: { id: true, title: true, date: true, venue: true },
        },
      },
    });
    if (!agent) return notFound("Gate agent not found");

    // For ownership check we need the orgProfile relation
    const agentWithOwner = await resolveAgent(id);
    if (
      agentWithOwner &&
      !isOwnerOrAdmin(agentWithOwner, token.id as string, token.role)
    ) {
      return forbidden("Access denied");
    }

    return ok(agent);
  } catch (e) {
    return serverError(e);
  }
}

// ── PATCH /api/agents/[id] — ORGANIZER or ADMIN ───────────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token = await getToken({ req });
    if (!token?.id) return forbidden("Authentication required");

    if (token.role !== "ORGANIZER" && token.role !== "ADMIN") {
      return forbidden("Organizer or Admin access required");
    }

    const { id } = await params;

    const agent = await resolveAgent(id);
    if (!agent) return notFound("Gate agent not found");

    if (!isOwnerOrAdmin(agent, token.id as string, token.role)) {
      return forbidden("Access denied");
    }

    const body   = await req.json();
    const parsed = updateAgentSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(
        parsed.error.issues.map((i: { message: string }) => i.message).join(", "),
      );
    }

    const updated = await prisma.gateAgent.update({
      where: { id },
      data:  { status: parsed.data.status },
      include: {
        event: { select: { id: true, title: true, date: true, venue: true } },
      },
    });

    return ok(updated);
  } catch (e) {
    return serverError(e);
  }
}

// ── DELETE /api/agents/[id] — ORGANIZER or ADMIN ──────────────────────────
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token = await getToken({ req });
    if (!token?.id) return forbidden("Authentication required");

    if (token.role !== "ORGANIZER" && token.role !== "ADMIN") {
      return forbidden("Organizer or Admin access required");
    }

    const { id } = await params;

    const agent = await resolveAgent(id);
    if (!agent) return notFound("Gate agent not found");

    if (!isOwnerOrAdmin(agent, token.id as string, token.role)) {
      return forbidden("Access denied");
    }

    await prisma.gateAgent.delete({ where: { id } });

    return ok({ message: "Agent removed" });
  } catch (e) {
    return serverError(e);
  }
}
