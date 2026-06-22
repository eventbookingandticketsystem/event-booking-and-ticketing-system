import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import bcrypt from "bcryptjs";
import prisma from "../../../../prisma/client";
import {
  ok,
  created,
  forbidden,
  notFound,
  badRequest,
  serverError,
  paginated,
} from "@/lib/api-utils";
import { createAgentSchema } from "@/lib/validation/agent.schemas";
import { Prisma } from "@prisma/client";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Generate a readable 8-char password: 4 letters + 4 digits */
function generatePassword(): string {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz";
  const digits  = "23456789";
  let pw = "";
  for (let i = 0; i < 4; i++) pw += letters[Math.floor(Math.random() * letters.length)];
  for (let i = 0; i < 4; i++) pw += digits[Math.floor(Math.random() * digits.length)];
  // Shuffle
  return pw.split("").sort(() => Math.random() - 0.5).join("");
}

// ── GET /api/agents ───────────────────────────────────────────────────────────
// ORGANIZER or ADMIN: list agents they manage.
// GATE_AGENT: returns their own assignment(s) only.
export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req });
    if (!token?.id) return forbidden("Authentication required");

    // ── Gate agent fetching their own events ──────────────────────────────────
    if (token.role === "GATE_AGENT") {
      const agents = await prisma.gateAgent.findMany({
        where:   { userId: token.id as string },
        orderBy: { createdAt: "desc" },
        include: {
          event: { select: { id: true, title: true, date: true } },
        },
      });
      return ok(agents);
    }

    // ── Organizer / Admin ─────────────────────────────────────────────────────
    if (token.role !== "ORGANIZER" && token.role !== "ADMIN") {
      return forbidden("Access denied");
    }

    const { searchParams } = req.nextUrl;
    const eventIdParam = searchParams.get("eventId") ?? undefined;
    const statusParam  = searchParams.get("status")  ?? undefined;
    const page  = Math.max(1, Number(searchParams.get("page")  ?? 1));
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 20)));
    const skip  = (page - 1) * limit;

    let ownerFilter: Prisma.GateAgentWhereInput = {};
    if (token.role === "ORGANIZER") {
      ownerFilter = {
        event: { orgProfile: { userId: token.id as string } },
      };
    }

    const where: Prisma.GateAgentWhereInput = {
      ...ownerFilter,
      ...(eventIdParam && { eventId: eventIdParam }),
      ...(statusParam  && { status: statusParam as Prisma.EnumAgentStatusFilter }),
    };

    const [agents, total] = await Promise.all([
      prisma.gateAgent.findMany({
        where,
        skip,
        take:    limit,
        orderBy: { createdAt: "desc" },
        include: {
          event: { select: { id: true, title: true, date: true } },
        },
      }),
      prisma.gateAgent.count({ where }),
    ]);

    return paginated(agents, page, limit, total);
  } catch (e) {
    return serverError(e);
  }
}

// ── POST /api/agents ──────────────────────────────────────────────────────────
// ORGANIZER only — creates a GateAgent record AND a User account the agent
// can use to log in. Returns the plain-text password once (not stored).
export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req });
    if (!token?.id) return forbidden("Authentication required");

    if (token.role !== "ORGANIZER") {
      return forbidden("Organizer access required");
    }

    const body   = await req.json();
    const parsed = createAgentSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(
        parsed.error.issues.map((i: { message: string }) => i.message).join(", "),
      );
    }

    const { name, phone, gate, eventId } = parsed.data;

    // 1. Resolve organizer's profile
    const orgProfile = await prisma.orgProfile.findUnique({
      where: { userId: token.id as string },
    });
    if (!orgProfile) return forbidden("Organizer profile not found");

    // 2. Find the event and verify ownership
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return notFound("Event not found");
    if (event.orgProfileId !== orgProfile.id) return forbidden("You do not own this event");

    // 3. Check if a User already exists for this phone number
    const existingUser = await prisma.user.findFirst({ where: { phone } });

    // 4. Generate credentials
    const plainPassword = generatePassword();
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    let userId: string;

    if (existingUser) {
      // Re-use the existing user — update role to GATE_AGENT if needed
      await prisma.user.update({
        where: { id: existingUser.id },
        data:  {
          role:     "GATE_AGENT",
          name:     name,
          password: hashedPassword,           // reset password so organizer can share it
        },
      });
      userId = existingUser.id;
    } else {
      // 5a. Create a new User account for the agent
      const user = await prisma.user.create({
        data: {
          name,
          phone,
          password: hashedPassword,
          role:     "GATE_AGENT",
          agentProfile: {
            create: {
              phone,
              assignedGate: gate,
              status:       "ACTIVE",
            },
          },
        },
      });
      userId = user.id;
    }

    // 5b. Create AgentProfile if it doesn't exist yet
    const existingProfile = await prisma.agentProfile.findUnique({
      where: { userId },
    });
    if (!existingProfile) {
      await prisma.agentProfile.create({
        data: { userId, phone, assignedGate: gate, status: "ACTIVE" },
      });
    }

    // 6. Create the GateAgent record, linked to the user
    const agent = await prisma.gateAgent.create({
      data: { name, phone, gate, eventId, userId, status: "ACTIVE" },
      include: {
        event: { select: { id: true, title: true, date: true } },
      },
    });

    // 7. Return agent + the plain-text password (once only)
    return created({ ...agent, generatedPassword: plainPassword });
  } catch (e) {
    return serverError(e);
  }
}
