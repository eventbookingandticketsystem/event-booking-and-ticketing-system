import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "../../../../../../prisma/client";
import {
  requireAdmin,
  unauthorized,
  ok,
  notFound,
  badRequest,
  serverError,
} from "@/lib/api-utils";

const patchEventSchema = z.object({
  flagged: z.boolean().optional(),
  status:  z.enum(["DRAFT", "PUBLISHED", "ONGOING", "COMPLETED", "CANCELLED"]).optional(),
});

// ── PATCH /api/admin/events/[id] — ADMIN only: toggle flagged / status ─────
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token = await requireAdmin(req);
    if (!token) return unauthorized("Admin access required");

    const { id } = await params;
    const existing = await prisma.event.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return notFound("Event not found");

    const body   = await req.json();
    const parsed = patchEventSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(
        parsed.error.issues.map((i: { message: string }) => i.message).join(", "),
      );
    }

    const updated = await prisma.event.update({
      where: { id },
      data:  parsed.data,
      include: {
        orgProfile: { select: { id: true, orgName: true, contactName: true } },
        _count:     { select: { tiers: true, bookings: true, tickets: true } },
      },
    });

    return ok(updated);
  } catch (e) {
    return serverError(e);
  }
}

// ── DELETE /api/admin/events/[id] — ADMIN only: permanently remove event ──
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token = await requireAdmin(req);
    if (!token) return unauthorized("Admin access required");

    const { id } = await params;
    const existing = await prisma.event.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return notFound("Event not found");

    // MongoDB has no referential cascade — remove dependents first.
    await prisma.scanRecord.deleteMany({ where: { eventId: id } });
    await prisma.entryRatePoint.deleteMany({ where: { eventId: id } });
    await prisma.gateAgent.deleteMany({ where: { eventId: id } });
    await prisma.ticket.deleteMany({ where: { eventId: id } });
    await prisma.bookingLine.deleteMany({ where: { booking: { eventId: id } } });
    await prisma.booking.deleteMany({ where: { eventId: id } });
    await prisma.ticketTier.deleteMany({ where: { eventId: id } });
    await prisma.event.delete({ where: { id } });

    return ok({ message: "Event permanently removed" });
  } catch (e) {
    return serverError(e);
  }
}
