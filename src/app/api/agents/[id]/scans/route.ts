import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import prisma from "../../../../../../prisma/client";
import { ok, forbidden, notFound, serverError } from "@/lib/api-utils";

// ── Ownership helper — mirrors src/app/api/agents/[id]/route.ts ───────────
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

// ── GET /api/agents/[id]/scans — ORGANIZER (owner) or ADMIN ───────────────
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

    const agent = await resolveAgent(id);
    if (!agent) return notFound("Gate agent not found");

    if (!isOwnerOrAdmin(agent, token.id as string, token.role)) {
      return forbidden("Access denied");
    }

    const { searchParams } = req.nextUrl;
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 50)));

    const scans = await prisma.scanRecord.findMany({
      where:   { agentId: id },
      orderBy: { scannedAt: "desc" },
      take:    limit,
      select: {
        id:        true,
        result:    true,
        scannedAt: true,
        gate:      true,
        ticketRef: true,
        note:      true,
      },
    });

    return ok(scans);
  } catch (e) {
    return serverError(e);
  }
}
