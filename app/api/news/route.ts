import { NextRequest, NextResponse } from "next/server";
import { verifyCoAdminOrAdmin } from "@/app/lib/verifyAdmin";
import { requirePermission } from "@/app/lib/permissions/middleware";
import pool from "@/app/lib/db";
import { getSchoolContext } from "@/app/lib/schoolContext";

export async function GET(req: NextRequest) {
  // Allow all authenticated users to read news
  const context = await getSchoolContext(req);

  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let schoolId = context.schoolId;

  const requestedSchoolId = req.nextUrl.searchParams.get("schoolId") || req.nextUrl.searchParams.get("school_id");

  if (context.isSuperAdmin) {
    schoolId = requestedSchoolId || schoolId;
  } else if (requestedSchoolId && requestedSchoolId !== schoolId) {
    return NextResponse.json({ error: "Forbidden: Cannot access other school's data" }, { status: 403 });
  }

  if (!schoolId) {
    schoolId = "00000000-0000-0000-0000-000000000001";
  }

  // For non-admin users, only return published news
  let query: string;
  let params: any[];

  if (context.canAccessAdmin) {
    // Admin/Co-admin can see all news
    query = "SELECT id, title, content, is_published, expires_at, created_at, target_audience FROM news WHERE school_id = $1 ORDER BY created_at DESC";
    params = [schoolId];
  } else {
    // Teachers and students only see published, non-expired news
    query = "SELECT id, title, content, created_at, target_audience FROM news WHERE school_id = $1 AND is_published = true AND (expires_at IS NULL OR expires_at > NOW()) ORDER BY created_at DESC";
    params = [schoolId];
  }

  const result = await pool.query(query, params);
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

  const { title, content, is_published, expires_at, target_audience } = await req.json();
  if (!title || !content) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  const expiresAt = expires_at ? new Date(expires_at) : null;
  if (expiresAt && Number.isNaN(expiresAt.getTime())) {
    return NextResponse.json({ error: "Invalid expiration date" }, { status: 400 });
  }
  const targetAudience = target_audience || 'all';
  if (!['all', 'admin', 'teacher', 'student'].includes(targetAudience)) {
    return NextResponse.json({ error: "Invalid target_audience" }, { status: 400 });
  }
  const result = await pool.query(
    "INSERT INTO news (title, content, is_published, expires_at, target_audience, school_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
    [title, content, is_published ?? true, expiresAt, targetAudience, schoolId]
  );
  return NextResponse.json(result.rows[0]);
}
