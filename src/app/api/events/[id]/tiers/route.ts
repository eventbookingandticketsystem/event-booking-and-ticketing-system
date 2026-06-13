import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import prisma from "../../../../../../prisma/client";
import {
  created,
  forbidden,
  notFound,
  badRequest,
  serverError,
} from "@/lib/api-utils";
import { tierSchema } from "@/lib/validation/event.schemas";

// ── Ownership helper ───────────────────────────────────────────────────────
async function assertOwner(eventId: string, tokenId: string, tokenRole: unknown) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { orgProfile: { select: { userId: true } } },
  });
  if (!event) return { error: notFound("Event not found"), event: null };
  if (event.orgProfile?.userId !== tokenId && tokenRole !== "ADMIN") {
    return { error: forbidden("You do not own this event"), event: null };
  }
  return { error: null, event };
}

// ── POST /api/events/[id]/tiers — add tier ────────────────────────────────
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token = await getToken({ req });
    if (!token?.id) return forbidden("Authentication required");

    const { id } = await params;
    const { error } = await assertOwner(id, token.id as string, token.role);
    if (error) return error;

    const body   = await req.json();
    const parsed = tierSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(
        parsed.error.issues.map((i: { message: string }) => i.message).join(", "),
      );
    }

    const { saleOpens, saleCloses, ...rest } = parsed.data;

    const tier = await prisma.ticketTier.create({
      data: {
        ...rest,
        remaining:  rest.capacity,
        soldOut:    false,
        lowStock:   false,
        eventId:    id,
        saleOpens:  saleOpens  ? new Date(saleOpens)  : undefined,
        saleCloses: saleCloses ? new Date(saleCloses) : undefined,
      },
    });

    return created(tier);
  } catch (e) {
    return serverError(e);
  }
}
