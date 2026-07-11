import { NextRequest, NextResponse } from "next/server";
import { verifyUser } from "@/app/lib/verifyUser";
import pool from "@/app/lib/db";

async function ownsSubject(userId: string, subjectId: string): Promise<boolean> {
  const result = await pool.query(
    `SELECT 1 FROM subjects s
     LEFT JOIN subject_teachers st ON st.subject_id = s.id
     WHERE s.id = $1 AND (s.teacher_id = $2 OR st.user_id = $2)
     LIMIT 1`,
    [subjectId, userId]
  );
  return result.rows.length > 0;
}

const VALID_STATUSES = new Set(["present", "absent", "late", "leave"]);

export async function POST(req: NextRequest) {
  const user = await verifyUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { subjectId, classroomId, date, term, records } = await req.json();

  if (!subjectId || !classroomId || !date || !term || !Array.isArray(records)) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (user.role !== "admin" && !(await ownsSubject(user.id, subjectId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  for (const r of records) {
    if (!r.studentId || !VALID_STATUSES.has(r.status)) {
      return NextResponse.json({ error: `Invalid record: ${JSON.stringify(r)}` }, { status: 400 });
    }
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const saved = [];
    for (const r of records) {
      const result = await client.query(
        `INSERT INTO attendance_records (student_id, subject_id, classroom_id, date, status, note, term, recorded_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT ON CONSTRAINT unique_attendance_record
         DO UPDATE SET status = EXCLUDED.status, note = EXCLUDED.note, classroom_id = EXCLUDED.classroom_id,
           term = EXCLUDED.term, recorded_by = EXCLUDED.recorded_by, updated_at = now()
         RETURNING id, student_id, subject_id, classroom_id, date, status, note, term`,
        [r.studentId, subjectId, classroomId, date, r.status, r.note ?? null, term, user.id]
      );
      saved.push(result.rows[0]);
    }
    await client.query("COMMIT");
    return NextResponse.json(saved, { status: 201 });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("POST /api/attendance/batch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  } finally {
    client.release();
  }
}
