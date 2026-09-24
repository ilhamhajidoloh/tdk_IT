import { NextRequest, NextResponse } from "next/server";
import pool from "@/app/lib/db";
import { requirePermission } from "@/app/lib/permissions/middleware";
import { getSchoolContext } from "@/app/lib/schoolContext";

const DEFAULT_SCHOOL_ID = "00000000-0000-0000-0000-000000000001";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const permError = await requirePermission(req, "schedules.delete");
  if (permError) return permError;

  const { id } = await params;
  const schoolId = (await getSchoolContext(req))?.schoolId || DEFAULT_SCHOOL_ID;
  await pool.query("DELETE FROM class_schedules WHERE id = $1 AND (school_id = $2 OR school_id IS NULL)", [id, schoolId]);
  return NextResponse.json({ success: true });
}
