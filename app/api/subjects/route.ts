import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/app/lib/verifyAdmin";
import pool from "@/app/lib/db";
import { getSchoolContext } from "@/app/lib/schoolContext";

async function hasSubjectTeachersTable(): Promise<boolean> {
  try {
    await pool.query("SELECT 1 FROM subject_teachers LIMIT 0");
    return true;
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("Authorization")?.split("Bearer ")[1];
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const context = await getSchoolContext();
    let schoolId = context?.schoolId;
    if (context?.isSuperAdmin) {
      schoolId = req.nextUrl.searchParams.get("schoolId") || req.nextUrl.searchParams.get("school_id") || schoolId;
    } else if (req.nextUrl.searchParams.get("schoolId") || req.nextUrl.searchParams.get("school_id")) {
      // Non-super admin cannot request data from other schools
      return NextResponse.json({ error: "Forbidden: Cannot access other school's data" }, { status: 403 });
    }
    if (!schoolId) schoolId = "00000000-0000-0000-0000-000000000001";

    const { searchParams } = new URL(req.url);
    const settingId = searchParams.get("settingId");

    const params: any[] = [schoolId];
    let whereClause = `WHERE (s.school_id = $1 OR s.school_id IS NULL)`;
    if (settingId) {
      params.push(settingId);
      whereClause += ` AND s.setting_id = $2`;
    }

    const multiTeacherReady = await hasSubjectTeachersTable();

    const teacherCols = multiTeacherReady
      ? `COALESCE(
           (SELECT array_agg(st.user_id::text ORDER BY st.user_id::text)
            FROM subject_teachers st
            WHERE st.subject_id = s.id),
           CASE WHEN s.teacher_id IS NOT NULL THEN ARRAY[s.teacher_id::text] ELSE '{}' END
         ) as teacher_ids,
         COALESCE(
           (SELECT array_agg(st_u.username ORDER BY st_u.username)
            FROM subject_teachers st
            JOIN users st_u ON st_u.id = st.user_id
            WHERE st.subject_id = s.id),
           CASE WHEN u.username IS NOT NULL THEN ARRAY[u.username] ELSE '{}' END
         ) as teacher_names,`
      : `CASE WHEN s.teacher_id IS NOT NULL THEN ARRAY[s.teacher_id::text] ELSE '{}' END as teacher_ids,
         CASE WHEN u.username IS NOT NULL THEN ARRAY[u.username] ELSE '{}' END as teacher_names,`;

    const result = await pool.query(`
      SELECT s.id, s.name, s.teacher_id, s.setting_id, s.midterm_max_score, s.final_max_score,
             s.subject_type, s.credit_hours, s.score_display_mode,
             u.username as teacher_name,
             ${teacherCols}
             COALESCE(array_agg(sc.classroom_id) FILTER (WHERE sc.classroom_id IS NOT NULL), '{}') as classroom_ids,
             COALESCE(array_agg(c.name) FILTER (WHERE c.name IS NOT NULL), '{}') as classroom_names
      FROM subjects s
      LEFT JOIN users u ON s.teacher_id = u.id
      LEFT JOIN subject_classrooms sc ON sc.subject_id = s.id
      LEFT JOIN classrooms c ON c.id = sc.classroom_id
      ${whereClause}
      GROUP BY s.id, s.name, s.teacher_id, s.setting_id, s.subject_type, s.credit_hours, s.score_display_mode, u.username
      ORDER BY s.name
    `, params);
    return NextResponse.json(result.rows);
  } catch (error: any) {
    console.error("GET /api/subjects error:", error);
    return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const context = await getSchoolContext();
  let schoolId = context?.schoolId || "00000000-0000-0000-0000-000000000001";

  const { name, teacher_ids, classroom_ids, setting_id, midterm_max_score, final_max_score, subject_type, credit_hours } = await req.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "Missing name" }, { status: 400 });
  }

  const primaryTeacherId = Array.isArray(teacher_ids) && teacher_ids.length > 0 ? teacher_ids[0] : null;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const result = await client.query(
      "INSERT INTO subjects (name, teacher_id, setting_id, midterm_max_score, final_max_score, subject_type, credit_hours, school_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *",
      [name.trim(), primaryTeacherId || null, setting_id || null, midterm_max_score || null, final_max_score || null, subject_type === "activity" ? "activity" : "main", credit_hours ?? 1, schoolId]
    );
    const subject = result.rows[0];

    if (Array.isArray(classroom_ids) && classroom_ids.length > 0) {
      const values = classroom_ids.map((_: string, i: number) => `($1, $${i + 2}, $${classroom_ids.length + 2})`).join(", ");
      await client.query(
        `INSERT INTO subject_classrooms (subject_id, classroom_id, school_id) VALUES ${values}`,
        [subject.id, ...classroom_ids, schoolId]
      );
    }

    const multiTeacherReady = await hasSubjectTeachersTable();
    if (multiTeacherReady && Array.isArray(teacher_ids) && teacher_ids.length > 0) {
      const values = teacher_ids.map((_: string, i: number) => `($1, $${i + 2}, $${teacher_ids.length + 2})`).join(", ");
      await client.query(
        `INSERT INTO subject_teachers (subject_id, user_id, school_id) VALUES ${values} ON CONFLICT DO NOTHING`,
        [subject.id, ...teacher_ids, schoolId]
      );
    }

    await client.query("COMMIT");
    return NextResponse.json({ ...subject, classroom_ids: classroom_ids || [], teacher_ids: teacher_ids || [] }, { status: 201 });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("POST /api/subjects error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  } finally {
    client.release();
  }
}
