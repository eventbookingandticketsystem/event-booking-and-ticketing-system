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

// Fields returned for every user response (password never included)
const USER_SELECT = {
  id:           true,
  name:         true,
  email:        true,
  phone:        true,
  role:         true,
  image:        true,
  createdAt:    true,
  updatedAt:    true,
  orgProfile:   true,
  agentProfile: true,
} as const;

// Inline patch schema
const patchUserSchema = z.object({
  role:   z.enum(["ATTENDEE", "ORGANIZER", "GATE_AGENT", "ADMIN"]).optional(),
  name:   z.string().min(2).optional(),
  phone:  z.string().optional(),
  status: z.enum(["Active", "Suspended"]).optional(),
});

// ── GET /api/admin/users/[id] ──────────────────────────────────────────────
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token = await requireAdmin(req);
    if (!token) return unauthorized("Admin access required");

    const { id } = await params;
    const user = await prisma.user.findUnique({ where: { id }, select: USER_SELECT });
    if (!user) return notFound("User not found");

    return ok(user);
  } catch (e) {
    return serverError(e);
  }
}

// ── PATCH /api/admin/users/[id] ────────────────────────────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token = await requireAdmin(req);
    if (!token) return unauthorized("Admin access required");

    const { id } = await params;

    const existing = await prisma.user.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return notFound("User not found");

    const body   = await req.json();
    const parsed = patchUserSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(
        parsed.error.issues.map((i: { message: string }) => i.message).join(", "),
      );
    }

    const { status, ...userFields } = parsed.data;

    // "status" lives on OrgProfile (suspend/reactivate an organizer), not User.
    if (status) {
      await prisma.orgProfile.updateMany({ where: { userId: id }, data: { status } });
    }

    // Only update fields that were provided
    const updated = await prisma.user.update({
      where: { id },
      data:  userFields,
      select: USER_SELECT,
    });

    return ok(updated);
  } catch (e) {
    return serverError(e);
  }
}

// ── DELETE /api/admin/users/[id] ───────────────────────────────────────────
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token = await requireAdmin(req);
    if (!token) return unauthorized("Admin access required");

    const { id } = await params;

    const user = await prisma.user.findUnique({ where: { id }, select: { id: true } });
    if (!user) return notFound("User not found");

    // Prevent self-delete
    if (id === (token.id as string)) {
      return badRequest("Cannot delete your own account");
    }

    // Cascade delete — MongoDB has no referential cascade for these relations
    await prisma.session.deleteMany({ where: { userId: id } });
    await prisma.account.deleteMany({ where: { userId: id } });
    await prisma.ticket.deleteMany({ where: { ownerId: id } });
    await prisma.booking.deleteMany({ where: { userId: id } });

    // If this user is an organizer, remove their events (and everything under them) too.
    const orgProfile = await prisma.orgProfile.findUnique({ where: { userId: id }, select: { id: true } });
    if (orgProfile) {
      const events = await prisma.event.findMany({ where: { orgProfileId: orgProfile.id }, select: { id: true } });
      const eventIds = events.map((e) => e.id);
      if (eventIds.length > 0) {
        await prisma.scanRecord.deleteMany({ where: { eventId: { in: eventIds } } });
        await prisma.entryRatePoint.deleteMany({ where: { eventId: { in: eventIds } } });
        await prisma.gateAgent.deleteMany({ where: { eventId: { in: eventIds } } });
        await prisma.ticket.deleteMany({ where: { eventId: { in: eventIds } } });
        await prisma.bookingLine.deleteMany({ where: { booking: { eventId: { in: eventIds } } } });
        await prisma.booking.deleteMany({ where: { eventId: { in: eventIds } } });
        await prisma.ticketTier.deleteMany({ where: { eventId: { in: eventIds } } });
        await prisma.event.deleteMany({ where: { id: { in: eventIds } } });
      }
    }

    await prisma.orgProfile.deleteMany({ where: { userId: id } });
    await prisma.agentProfile.deleteMany({ where: { userId: id } });
    await prisma.user.delete({ where: { id } });

    return ok({ message: "User deleted" });
  } catch (e) {
    return serverError(e);
  }
}
