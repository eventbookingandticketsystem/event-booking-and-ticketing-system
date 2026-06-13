import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "../../../../../prisma/client";
import { created, badRequest, serverError } from "@/lib/api-utils";
import { registerSchema } from "@/lib/validation/auth.schemas";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest(
        parsed.error.issues.map((e: { message: string }) => e.message).join(", "),
      );
    }

    const { name, phone, email, password, role, orgName } = parsed.data;

    // Normalise: treat empty string as absent
    const emailVal = email || null;
    const phoneVal = phone || null;

    // Duplicate check
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          ...(emailVal ? [{ email: emailVal }] : []),
          ...(phoneVal ? [{ phone: phoneVal }] : []),
        ],
      },
    });

    if (existing) {
      return badRequest("Phone or email is already registered");
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email:    emailVal,
        phone:    phoneVal,
        password: hashed,
        role:     role ?? "ATTENDEE",
        ...(role === "ORGANIZER" && {
          orgProfile: {
            create: {
              orgName:     orgName ?? name,
              contactName: name,
              phone:       phoneVal ?? "",
              revenue:     0,
              status:      "Active",
            },
          },
        }),
      },
      select: {
        id:         true,
        name:       true,
        email:      true,
        phone:      true,
        role:       true,
        createdAt:  true,
        orgProfile: true,
      },
    });

    return created(user);
  } catch (e) {
    return serverError(e);
  }
}
