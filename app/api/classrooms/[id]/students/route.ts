import { NextRequest, NextResponse } from "next/server";
import pool from "@/app/lib/db";
import { requirePermission } from "@/app/lib/permissions/middleware";
import { getSchoolContext } from "@/app/lib/schoolContext";

const DEFAULT_SCHOOL_ID = "00000000-0000-0000-0000-000000000001";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const permError = await requirePermission(req, "classrooms.manage_students");
  if (permError) return permError;

  const { id: classroom_id } = await params;
  const schoolId = (await getSchoolContext(req))?.schoolId || DEFAULT_SCHOOL_ID;
  const { student_ids } = await req.json();

  if (!Array.isArray(student_ids)) {
    return NextResponse.json({ error: "Invalid student_ids array" }, { status: 400 });
  }

  try {
    if (student_ids.length > 0) {
      const classroomRes = await pool.query("SELECT setting_id FROM classrooms WHERE id = $1 AND (school_id = $2 OR school_id IS NULL)", [classroom_id, schoolId]);
      if (classroomRes.rows.length === 0) {
        return NextResponse.json({ error: "Classroom not found" }, { status: 404 });
      }
      const settingId = classroomRes.rows[0].setting_id;

      for (const studentId of student_ids) {
        await pool.query(
          `INSERT INTO classroom_students (student_id, classroom_id, setting_id, school_id)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (student_id, setting_id)
           DO UPDATE SET classroom_id = excluded.classroom_id, school_id = excluded.school_id`,
          [studentId, classroom_id, settingId, schoolId]
        );
      }
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error bulk assigning students:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
