import { NextResponse } from "next/server";

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
