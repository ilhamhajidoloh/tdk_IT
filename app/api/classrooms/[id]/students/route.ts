import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/app/lib/verifyAdmin";
import pool from "@/app/lib/db";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await verifyAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: classroom_id } = await params;
  const { student_ids } = await req.json();

  if (!Array.isArray(student_ids)) {
    return NextResponse.json({ error: "Invalid student_ids array" }, { status: 400 });
  }

  try {
    if (student_ids.length > 0) {
      const classroomRes = await pool.query("SELECT setting_id FROM classrooms WHERE id = $1", [classroom_id]);
      if (classroomRes.rows.length === 0) {
        return NextResponse.json({ error: "Classroom not found" }, { status: 404 });
      }
      const settingId = classroomRes.rows[0].setting_id;

      for (const studentId of student_ids) {
        await pool.query(
          `INSERT INTO classroom_students (student_id, classroom_id, setting_id)
           VALUES ($1, $2, $3)
           ON CONFLICT (student_id, setting_id)
           DO UPDATE SET classroom_id = excluded.classroom_id`,
          [studentId, classroom_id, settingId]
        );
      }
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error bulk assigning students:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
