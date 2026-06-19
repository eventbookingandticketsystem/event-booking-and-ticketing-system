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
  role:  z.enum(["ATTENDEE", "ORGANIZER", "GATE_AGENT", "ADMIN"]).optional(),
  name:  z.string().min(2).optional(),
  phone: z.string().optional(),
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

    // Only update fields that were provided
    const updated = await prisma.user.update({
      where: { id },
      data:  parsed.data,
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
    await prisma.orgProfile.deleteMany({ where: { userId: id } });
    await prisma.agentProfile.deleteMany({ where: { userId: id } });
    await prisma.user.delete({ where: { id } });

    return ok({ message: "User deleted" });
  } catch (e) {
    return serverError(e);
  }
}
