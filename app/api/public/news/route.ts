import { NextRequest, NextResponse } from "next/server";
import pool from "@/app/lib/db";

export async function GET(req: NextRequest) {
  const schoolId = req.nextUrl.searchParams.get("schoolId") || req.nextUrl.searchParams.get("school_id") || "00000000-0000-0000-0000-000000000001";
  const role = req.nextUrl.searchParams.get("role") || "all";

  // Build the target audience filter
  // If role is provided, show news for 'all' OR the specific role
  const targetFilter = role === "all"
    ? ["all"]
    : ["all", role];

  const result = await pool.query(
    `SELECT id, title, content, created_at, expires_at, target_audience
     FROM news
     WHERE school_id = $1
       AND is_published = true
       AND target_audience = ANY($2)
       AND (expires_at IS NULL OR expires_at > NOW())
     ORDER BY created_at DESC`,
    [schoolId, targetFilter]
  );

  return NextResponse.json(result.rows);
}
