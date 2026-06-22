import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import prisma from "../../../../../prisma/client";
import { ok, unauthorized, notFound, serverError } from "@/lib/api-utils";

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req });
    if (!token?.id) return unauthorized();

    const user = await prisma.user.findUnique({
      where: { id: token.id as string },
      select: {
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
      },
    });

    if (!user) return notFound("User not found");
    return ok(user);
  } catch (e) {
    return serverError(e);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const token = await getToken({ req });
    if (!token?.id) return unauthorized();

    const body = await req.json();

    // Only allow updating safe profile fields
    const allowed = ["name", "phone", "image"] as const;
    type AllowedKey = (typeof allowed)[number];

    const data: Partial<Record<AllowedKey, string>> = {};
    for (const key of allowed) {
      if (key in body && typeof body[key] === "string") {
        data[key] = body[key] as string;
      }
    }

    const user = await prisma.user.update({
      where: { id: token.id as string },
      data,
      select: {
        id:        true,
        name:      true,
        email:     true,
        phone:     true,
        role:      true,
        image:     true,
        updatedAt: true,
      },
    });

    return ok(user);
  } catch (e) {
    return serverError(e);
  }
}
