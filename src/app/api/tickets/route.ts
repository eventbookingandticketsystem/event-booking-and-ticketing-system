import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import prisma from "../../../../prisma/client";
import { forbidden, serverError, paginated } from "@/lib/api-utils";
import { Prisma } from "@prisma/client";

// ── GET /api/tickets — auth required ──────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req });
    if (!token?.id) return forbidden("Authentication required");

    const { searchParams } = req.nextUrl;
    const statusParam = searchParams.get("status") ?? undefined;
    const page  = Math.max(1, Number(searchParams.get("page")  ?? 1));
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 10)));
    const skip  = (page - 1) * limit;

    const where: Prisma.TicketWhereInput = {
      ownerId: token.id as string,
      ...(statusParam && {
        status: statusParam as Prisma.EnumTicketStatusFilter,
      }),
    };

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        skip,
        take:    limit,
        orderBy: { issuedAt: "desc" },
        include: {
          event: {
            select: {
              id:        true,
              title:     true,
              date:      true,
              venue:     true,
              category:  true,
              poster:    true,
              city:      true,
              organizer: true,
            },
          },
        },
      }),
      prisma.ticket.count({ where }),
    ]);

    return paginated(tickets, page, limit, total);
  } catch (e) {
    return serverError(e);
  }
}
