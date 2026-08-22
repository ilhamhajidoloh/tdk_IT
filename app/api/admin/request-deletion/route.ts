import { NextRequest, NextResponse } from "next/server";
import pool from "@/app/lib/db";
import { getSchoolContext } from "@/app/lib/schoolContext";

// Admin requests deletion of their own school
export async function POST(req: NextRequest) {
  const context = await getSchoolContext(req);
  if (!context || context.role !== "admin" || !context.schoolId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const result = await pool.query(
      "UPDATE public.schools SET deletion_requested = true, deletion_requested_at = NOW() WHERE id = $1 RETURNING id, name, deletion_requested, deletion_requested_at",
      [context.schoolId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, school: result.rows[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to request deletion" }, { status: 500 });
  }
}

// Admin cancels their deletion request
export async function DELETE(req: NextRequest) {
  const context = await getSchoolContext(req);
  if (!context || context.role !== "admin" || !context.schoolId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await pool.query(
      "UPDATE public.schools SET deletion_requested = false, deletion_requested_at = NULL WHERE id = $1",
      [context.schoolId]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to cancel deletion request" }, { status: 500 });
  }
}
