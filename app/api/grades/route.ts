import { NextRequest, NextResponse } from "next/server";
import pool from "@/app/lib/db";
import { verifyUser } from "@/app/lib/verifyUser";
import { getSchoolContext } from "@/app/lib/schoolContext";

const DEFAULT_SCHOOL_ID = "00000000-0000-0000-0000-000000000001";

function formatRow(row: Record<string, unknown> | null | undefined) {
  if (!row) return row;
  return {
    ...row,
    midterm_score: row.midterm_score !== null ? Number(row.midterm_score) : null,
    final_score: row.final_score !== null ? Number(row.final_score) : null,
  };
}

export async function GET(req: NextRequest) {
  const user = await verifyUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const schoolContext = await getSchoolContext(req);
  const schoolId = schoolContext?.schoolId || DEFAULT_SCHOOL_ID;

  let studentId = req.nextUrl.searchParams.get("studentId");
  if (user.role === "student") {
    if (!user.student_id || (studentId && studentId !== user.student_id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    studentId = user.student_id;
  }
  const term = req.nextUrl.searchParams.get("term");

  let query = "SELECT * FROM grades WHERE school_id = $1";
  const params: string[] = [schoolId];

  if (studentId) {
    params.push(studentId);
    query += ` AND student_id = $${params.length}`;
  }
  if (term) {
    params.push(term);
    query += ` AND term = $${params.length}`;
  }

  query += " ORDER BY student_id, subject";
  const result = await pool.query(query, params);
  return NextResponse.json(result.rows.map(formatRow));
}

export async function POST(req: NextRequest) {
  const user = await verifyUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role === "student") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const schoolContext = await getSchoolContext(req);
  const schoolId = schoolContext?.schoolId || DEFAULT_SCHOOL_ID;

  const { student_id, subject, midterm_score, final_score, term } = await req.json();

  if (!student_id || !subject || !term) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Upsert — ถ้ามีอยู่แล้ว (student+subject+term) ให้ update แทน insert
  // The subject may be taught to a classroom without collecting grades there.
  // Enforce this at the API boundary so it cannot be bypassed by a direct call.
  const scoreEnabled = await pool.query(
    `SELECT 1
       FROM subjects s
       JOIN system_settings ss ON ss.id = s.setting_id
       JOIN students st ON st.student_id = $1
         AND (st.school_id = $4 OR st.school_id IS NULL)
       JOIN classroom_students cs ON cs.student_id = st.id
         AND cs.setting_id = s.setting_id
       JOIN subject_classrooms sc ON sc.subject_id = s.id
         AND sc.classroom_id = cs.classroom_id
      WHERE s.name = $2
        AND CONCAT(ss.term, '/', ss.academic_year) = $3
        AND (s.school_id = $4 OR s.school_id IS NULL)
        AND COALESCE(sc.score_enabled, TRUE) = TRUE
      LIMIT 1`,
    [student_id, subject, term, schoolId]
  );
  if (scoreEnabled.rows.length === 0) {
    return NextResponse.json(
      { error: "This subject is not configured to collect scores for the student's classroom" },
      { status: 403 }
    );
  }

  const result = await pool.query(
    `INSERT INTO grades (student_id, subject, midterm_score, final_score, term, school_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT ON CONSTRAINT unique_student_subject_term
     DO UPDATE SET midterm_score = EXCLUDED.midterm_score, final_score = EXCLUDED.final_score
     RETURNING *`,
    [student_id, subject, midterm_score ?? null, final_score ?? null, term, schoolId]
  );

  return NextResponse.json(formatRow(result.rows[0]), { status: 201 });
}
