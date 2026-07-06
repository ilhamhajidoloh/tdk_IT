import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/app/lib/verifyAdmin";
import pool from "@/app/lib/db";

export async function POST(req: NextRequest) {
  if (!await verifyAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { target_setting_id, classrooms } = await req.json();

  if (!target_setting_id || !Array.isArray(classrooms) || classrooms.length === 0) {
    return NextResponse.json({ error: "Missing required fields or empty classrooms" }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    for (const c of classrooms) {
      if (!c.new_name?.trim() || !c.old_classroom_id) continue;

      // Create new classroom
      const insertResult = await client.query(
        "INSERT INTO classrooms (name, setting_id) VALUES ($1, $2) RETURNING id",
        [c.new_name.trim(), target_setting_id]
      );
      const newClassroomId = insertResult.rows[0].id;

      // Enroll students into the new term's classroom, without touching their
      // enrollment in the old term's classroom (classroom_students is per-setting).
      if (c.move_students) {
        const roster = await client.query(
          `SELECT DISTINCT s.id as student_id, COALESCE(cs.student_number, s.student_number) as student_number
           FROM students s
           LEFT JOIN classroom_students cs ON cs.student_id = s.id AND cs.classroom_id = $1
           WHERE cs.classroom_id = $1 OR s.classroom_id = $1`,
          [c.old_classroom_id]
        );
        for (const r of roster.rows) {
          await client.query(
            `INSERT INTO classroom_students (student_id, classroom_id, setting_id, student_number)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (student_id, setting_id)
             DO UPDATE SET classroom_id = excluded.classroom_id, student_number = excluded.student_number`,
            [r.student_id, newClassroomId, target_setting_id, r.student_number]
          );
        }
      }
    }

    await client.query("COMMIT");
    return NextResponse.json({ success: true });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error copying classrooms:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  } finally {
    client.release();
  }
}
