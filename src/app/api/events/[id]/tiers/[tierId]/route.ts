import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import prisma from "../../../../../../../prisma/client";
import {
  ok,
  forbidden,
  notFound,
  badRequest,
  serverError,
} from "@/lib/api-utils";

// ── Ownership helper ───────────────────────────────────────────────────────
async function assertOwner(eventId: string, tokenId: string, tokenRole: unknown) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { orgProfile: { select: { userId: true } } },
  });
  if (!event) return { error: notFound("Event not found"), ok: false };
  if (event.orgProfile?.userId !== tokenId && tokenRole !== "ADMIN") {
    return { error: forbidden("You do not own this event"), ok: false };
  }
  return { error: null, ok: true };
}

// Fields allowed in a tier PATCH (capacity intentionally excluded)
const patchTierSchema = z.object({
  name:       z.string().min(1).optional(),
  price:      z.number().min(0).optional(),
  saleOpens:  z.string().datetime().optional(),
  saleCloses: z.string().datetime().optional(),
});

// ── PATCH /api/events/[id]/tiers/[tierId] ─────────────────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; tierId: string }> },
) {
  try {
    const token = await getToken({ req });
    if (!token?.id) return forbidden("Authentication required");

    const { id, tierId } = await params;
    const { error } = await assertOwner(id, token.id as string, token.role);
    if (error) return error;

    const tier = await prisma.ticketTier.findUnique({ where: { id: tierId } });
    if (!tier || tier.eventId !== id) return notFound("Tier not found");

    const body   = await req.json();
    const parsed = patchTierSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(
        parsed.error.issues.map((i: { message: string }) => i.message).join(", "),
      );
    }

    const { saleOpens, saleCloses, ...rest } = parsed.data;

    const updated = await prisma.ticketTier.update({
      where: { id: tierId },
      data: {
        ...rest,
        ...(saleOpens  && { saleOpens:  new Date(saleOpens)  }),
        ...(saleCloses && { saleCloses: new Date(saleCloses) }),
      },
    });

    return ok(updated);
  } catch (e) {
    return serverError(e);
  }
}

// ── DELETE /api/events/[id]/tiers/[tierId] ────────────────────────────────
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; tierId: string }> },
) {
  try {
    const token = await getToken({ req });
    if (!token?.id) return forbidden("Authentication required");

    const { id, tierId } = await params;
    const { error } = await assertOwner(id, token.id as string, token.role);
    if (error) return error;

    const tier = await prisma.ticketTier.findUnique({ where: { id: tierId } });
    if (!tier || tier.eventId !== id) return notFound("Tier not found");

    // Guard: cannot remove tier that already has sold tickets
    const soldCount = await prisma.ticket.count({ where: { tierId } });
    if (soldCount > 0) {
      return badRequest("Cannot remove tier with sold tickets");
    }

    await prisma.ticketTier.delete({ where: { id: tierId } });

    return ok({ message: "Tier removed" });
  } catch (e) {
    return serverError(e);
  }
}
