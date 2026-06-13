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
import { updateEventSchema } from "@/lib/validation/event.schemas";

// ── Resolve event + ownership check ───────────────────────────────────────
async function resolveEvent(id: string) {
  return prisma.event.findUnique({
    where: { id },
    include: {
      tiers:      true,
      orgProfile: true,
    },
  });
}

function isOwnerOrAdmin(
  event: NonNullable<Awaited<ReturnType<typeof resolveEvent>>>,
  tokenId: string,
  tokenRole: unknown,
) {
  return (
    event.orgProfile?.userId === tokenId || tokenRole === "ADMIN"
  );
}

// ── GET /api/events/[id] — public ─────────────────────────────────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const event = await resolveEvent(id);
    if (!event) return notFound("Event not found");
    return ok(event);
  } catch (e) {
    return serverError(e);
  }
}

// ── PUT /api/events/[id] — ORGANIZER (owner) or ADMIN ─────────────────────
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token = await getToken({ req });
    if (!token?.id) return forbidden("Authentication required");

    const { id } = await params;
    const event = await resolveEvent(id);
    if (!event) return notFound("Event not found");

    if (!isOwnerOrAdmin(event, token.id as string, token.role)) {
      return forbidden("You do not own this event");
    }

    const body   = await req.json();
    const parsed = updateEventSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(
        parsed.error.issues.map((i: { message: string }) => i.message).join(", "),
      );
    }

    const data = parsed.data;

    const updated = await prisma.event.update({
      where: { id },
      data: {
        ...data,
        ...(data.date && { date: new Date(data.date) }),
      },
      include: {
        tiers:      true,
        orgProfile: { select: { id: true, orgName: true, contactName: true } },
      },
    });

    return ok(updated);
  } catch (e) {
    return serverError(e);
  }
}

// ── DELETE /api/events/[id] — soft delete (CANCELLED) ─────────────────────
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token = await getToken({ req });
    if (!token?.id) return forbidden("Authentication required");

    const { id } = await params;
    const event = await resolveEvent(id);
    if (!event) return notFound("Event not found");

    if (!isOwnerOrAdmin(event, token.id as string, token.role)) {
      return forbidden("You do not own this event");
    }

    await prisma.event.update({
      where: { id },
      data:  { status: "CANCELLED" },
    });

    return ok({ message: "Event cancelled" });
  } catch (e) {
    return serverError(e);
  }
}
