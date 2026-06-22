import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import bcrypt from "bcryptjs";
import prisma from "../../../../../../prisma/client";
import { ok, unauthorized, badRequest, serverError } from "@/lib/api-utils";

/**
 * PATCH /api/auth/me/password
 * Body: { currentPassword: string; newPassword: string }
 * Verifies current password, then hashes and stores the new one.
 */
export async function PATCH(req: NextRequest) {
  try {
    const token = await getToken({ req });
    if (!token?.id) return unauthorized();

    const body = await req.json();
    const { currentPassword, newPassword } = body as {
      currentPassword?: string;
      newPassword?: string;
    };

    if (!currentPassword || !newPassword) {
      return badRequest("currentPassword and newPassword are required");
    }
    if (newPassword.length < 8) {
      return badRequest("New password must be at least 8 characters");
    }

    const user = await prisma.user.findUnique({
      where: { id: token.id as string },
      select: { password: true },
    });

    if (!user?.password) {
      // OAuth-only account — no password set yet; allow setting one
      const hashed = await bcrypt.hash(newPassword, 12);
      await prisma.user.update({
        where: { id: token.id as string },
        data: { password: hashed },
      });
      return ok({ message: "Password set successfully" });
    }

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return badRequest("Current password is incorrect");

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: token.id as string },
      data: { password: hashed },
    });

    return ok({ message: "Password updated successfully" });
  } catch (e) {
    return serverError(e);
  }
}
