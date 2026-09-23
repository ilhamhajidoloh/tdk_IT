import { NextRequest, NextResponse } from "next/server";
import { verifyCoAdminOrAdmin } from "@/app/lib/verifyAdmin";
import { requirePermission } from "@/app/lib/permissions/middleware";
import pool from "@/app/lib/db";
import { getSchoolContext } from "@/app/lib/schoolContext";

export async function GET(req: NextRequest) {
  if (!await verifyCoAdminOrAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized / Forbidden" }, { status: 401 });
  }

  const context = await getSchoolContext(req);
  let schoolId = context?.schoolId;

  const requestedSchoolId = req.nextUrl.searchParams.get("schoolId") || req.nextUrl.searchParams.get("school_id");

  if (context?.isSuperAdmin) {
    schoolId = requestedSchoolId || schoolId;
  } else if (requestedSchoolId && requestedSchoolId !== schoolId) {
    return NextResponse.json({ error: "Forbidden: Cannot access other school's data" }, { status: 403 });
  }

  if (!schoolId) {
    schoolId = "00000000-0000-0000-0000-000000000001";
  }

  const result = await pool.query(
    "SELECT id, title, content, is_published, expires_at, created_at FROM news WHERE school_id = $1 ORDER BY created_at DESC",
    [schoolId]
  );
  return NextResponse.json(result.rows);
}

export async function POST(req: NextRequest) {
  const permError = await requirePermission(req, "news.create");
  if (permError) return permError;

  const context = await getSchoolContext();
  let schoolId = context?.schoolId;

  if (context?.isSuperAdmin) {
    schoolId = req.nextUrl.searchParams.get("schoolId") || req.nextUrl.searchParams.get("school_id") || schoolId;
  } else if (req.nextUrl.searchParams.get("schoolId") || req.nextUrl.searchParams.get("school_id")) {
    return NextResponse.json({ error: "Forbidden: Cannot access other school's data" }, { status: 403 });
  }

  if (!schoolId) {
    schoolId = "00000000-0000-0000-0000-000000000001";
  }

  const { title, content, is_published, expires_at } = await req.json();
  if (!title || !content) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  const expiresAt = expires_at ? new Date(expires_at) : null;
  if (expiresAt && Number.isNaN(expiresAt.getTime())) {
    return NextResponse.json({ error: "Invalid expiration date" }, { status: 400 });
  }
  const result = await pool.query(
    "INSERT INTO news (title, content, is_published, expires_at, school_id) VALUES ($1, $2, $3, $4, $5) RETURNING *",
    [title, content, is_published ?? true, expiresAt, schoolId]
  );
  return NextResponse.json(result.rows[0]);
}
