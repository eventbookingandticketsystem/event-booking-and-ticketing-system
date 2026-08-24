import { PrismaAdapter } from "@next-auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import prisma from "../../../../prisma/client";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id    = user.id;
        token.phone = (user as unknown as Record<string, unknown>).phone ?? null;

        // For OAuth sign-ins (Google), look up or default role from DB
        if (account?.provider === "google") {
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { role: true },
          });
          token.role = dbUser?.role ?? "ATTENDEE";
        } else {
          token.role = (user as unknown as Record<string, unknown>).role ?? "ATTENDEE";
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.id && session.user) {
        // Always pull fresh name/image/phone from DB so profile edits
        // reflect immediately without requiring a sign-out/sign-in cycle.
        const fresh = await prisma.user.findUnique({
          where:  { id: token.id as string },
          select: { name: true, image: true, phone: true, role: true },
        });

        const u = session.user as Record<string, unknown>;
        u.id    = token.id;
        u.role  = fresh?.role  ?? token.role;
        u.name  = fresh?.name  ?? session.user.name;
        u.image = fresh?.image ?? session.user.image;
        u.phone = fresh?.phone ?? token.phone;
      }
      return session;
    },
  },
  providers: [
    GoogleProvider({
      clientId:     process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        phone:    { label: "Phone",    type: "text"     },
        email:    { label: "Email",    type: "email"    },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials) return null;

        const { email, phone, password } = credentials as {
          email?: string;
          phone?: string;
          password: string;
        };

        const user = await prisma.user.findFirst({
          where: {
            OR: [
              ...(email ? [{ email }] : []),
              ...(phone ? [{ phone }] : []),
            ],
          },
          include: { orgProfile: true },
        });

        // No matching account — same generic outcome as a wrong password,
        // so a login attempt can never be used to enumerate deleted/unknown accounts.
        if (!user?.password) return null;

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return null;

        // Suspended organizer: OrgProfile.status is the source of truth for organizers.
        if (user.role === "ORGANIZER" && user.orgProfile?.status === "Suspended") {
          throw new Error("AccountSuspended");
        }

        // Deactivated gate agent: blocked only if EVERY event assignment is INACTIVE
        // (an agent with at least one active assignment may still sign in).
        if (user.role === "GATE_AGENT") {
          const assignments = await prisma.gateAgent.findMany({
            where:  { userId: user.id },
            select: { status: true },
          });
          if (assignments.length > 0 && assignments.every((a) => a.status === "INACTIVE")) {
            throw new Error("AccountSuspended");
          }
        }

        return user;
      },
    }),
  ],
};

export default authOptions;
