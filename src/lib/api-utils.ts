import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { randomBytes } from "crypto";
import { getToken } from "next-auth/jwt";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function created<T>(data: T) {
  return NextResponse.json({ success: true, data }, { status: 201 });
}

export function unauthorized(message = "Unauthorized") {
  return NextResponse.json({ success: false, message }, { status: 401 });
}

export function forbidden(message = "Forbidden") {
  return NextResponse.json({ success: false, message }, { status: 403 });
}

export function notFound(message = "Not found") {
  return NextResponse.json({ success: false, message }, { status: 404 });
}

export function badRequest(message = "Bad request") {
  return NextResponse.json({ success: false, message }, { status: 400 });
}

export function serverError(e: unknown) {
  const message =
    e instanceof Error ? e.message : "Internal server error";
  console.error("[API Error]", e);
  return NextResponse.json({ success: false, message }, { status: 500 });
}

export function paginated<T>(
  data: T[],
  page: number,
  limit: number,
  total: number,
) {
  return NextResponse.json({
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

/** "BKG-" + 8 uppercase hex chars  e.g. "BKG-A3F2C901" */
export function generateBookingRef(): string {
  return "BKG-" + randomBytes(4).toString("hex").toUpperCase();
}

/** "TIX-XXXX-XXXX"  e.g. "TIX-7K2M-9QX4" */
export function generateTicketRef(): string {
  const part = () => randomBytes(2).toString("hex").toUpperCase();
  return `TIX-${part()}-${part()}`;
}

/** Returns the JWT token if the caller is ADMIN, else null. */
export async function requireAdmin(req: NextRequest) {
  const token = await getToken({ req });
  if (!token?.id || token.role !== "ADMIN") return null;
  return token;
}

/** Returns the JWT token if the caller is ORGANIZER, else null.
 *  The route is responsible for resolving orgProfile after this check. */
export async function requireOrganizer(req: NextRequest) {
  const token = await getToken({ req });
  if (!token?.id || token.role !== "ORGANIZER") return null;
  return token;
}
