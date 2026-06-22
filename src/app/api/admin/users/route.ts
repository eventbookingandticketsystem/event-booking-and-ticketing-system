import { NextRequest } from "next/server";
import prisma from "../../../../../prisma/client";
import { requireAdmin, unauthorized, serverError, paginated } from "@/lib/api-utils";
import { Prisma } from "@prisma/client";

// ── GET /api/admin/users — ADMIN only ─────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const token = await requireAdmin(req);
    if (!token) return unauthorized("Admin access required");

    const { searchParams } = req.nextUrl;
    const roleParam   = searchParams.get("role")   ?? undefined;
    const search      = searchParams.get("search") ?? undefined;
    const page  = Math.max(1, Number(searchParams.get("page")  ?? 1));
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 10)));
    const skip  = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {
      ...(roleParam && { role: roleParam as Prisma.EnumUserRoleNullableFilter }),
      ...(search && {
        OR: [
          { name:  { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { phone: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    const select: Prisma.UserSelect = {
      id:        true,
      name:      true,
      email:     true,
      phone:     true,
      role:      true,
      image:     true,
      createdAt: true,
      updatedAt: true,
      // password intentionally excluded
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" }, select }),
      prisma.user.count({ where }),
    ]);

    return paginated(users, page, limit, total);
  } catch (e) {
    return serverError(e);
  }
}
