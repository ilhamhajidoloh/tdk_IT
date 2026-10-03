import { NextRequest, NextResponse } from "next/server";
import pool from "@/app/lib/db";
import { requirePermission } from "@/app/lib/permissions/middleware";
import { getSchoolContext } from "@/app/lib/schoolContext";
import { ensureStatusSchema } from "@/app/lib/statusMigration";

const DEFAULT_SCHOOL_ID = "00000000-0000-0000-0000-000000000001";

async function hasSubjectTeachersTable(client: { query: typeof pool.query }) {
  try {
    await client.query("SELECT 1 FROM subject_teachers LIMIT 0");
    return true;
  } catch {
    return false;
  }
}

async function hasScheduleTeacherColumn(client: { query: typeof pool.query }) {
  try {
    await client.query("SELECT teacher_id FROM class_schedules LIMIT 0");
    return true;
  } catch {
    return false;
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permError = await requirePermission(req, "users.edit");
  if (permError) return permError;

  await ensureStatusSchema();
  const { id } = await params;
  const { resignation_reason, replacement_teacher_id } = await req.json();
  const schoolId = (await getSchoolContext(req))?.schoolId || DEFAULT_SCHOOL_ID;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const teacherResult = await client.query(
      `SELECT id, username
         FROM users
        WHERE id = $1 AND role = 'teacher'
          AND (school_id = $2 OR school_id IS NULL)
        FOR UPDATE`,
      [id, schoolId]
    );
    if (teacherResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    const replacementId = typeof replacement_teacher_id === "string" && replacement_teacher_id.trim()
      ? replacement_teacher_id.trim()
      : null;
    if (replacementId) {
      if (replacementId === id) {
        await client.query("ROLLBACK");
        return NextResponse.json({ error: "A teacher cannot replace themself" }, { status: 400 });
      }
      const replacement = await client.query(
        `SELECT 1 FROM users
          WHERE id = $1 AND role = 'teacher' AND COALESCE(status, 'active') = 'active'
            AND (school_id = $2 OR school_id IS NULL)`,
        [replacementId, schoolId]
      );
      if (replacement.rows.length === 0) {
        await client.query("ROLLBACK");
        return NextResponse.json({ error: "Replacement teacher is not active or not found" }, { status: 400 });
      }
    }

    const subjectTeachersReady = await hasSubjectTeachersTable(client);
    const scheduleTeacherReady = await hasScheduleTeacherColumn(client);
    const subjectResult = subjectTeachersReady
      ? await client.query(
          `SELECT id FROM subjects WHERE teacher_id = $1
           UNION
           SELECT subject_id AS id FROM subject_teachers WHERE user_id = $1`,
          [id]
        )
      : await client.query("SELECT id FROM subjects WHERE teacher_id = $1", [id]);
    const subjectIds = subjectResult.rows.map((row) => row.id as string);

    await client.query(
      `UPDATE users
          SET status = 'resigned',
              resigned_at = COALESCE(resigned_at, NOW()),
              resignation_reason = $2
        WHERE id = $1`,
      [id, typeof resignation_reason === "string" && resignation_reason.trim() ? resignation_reason.trim() : null]
    );

    await client.query(
      `UPDATE subjects SET teacher_id = $1 WHERE teacher_id = $2`,
      [replacementId, id]
    );
    if (subjectTeachersReady) {
      await client.query("DELETE FROM subject_teachers WHERE user_id = $1", [id]);
      if (replacementId && subjectIds.length > 0) {
        const values = subjectIds.map((_: string, index: number) => `($${index + 1}, $${subjectIds.length + 1})`).join(", ");
        await client.query(
          `INSERT INTO subject_teachers (subject_id, user_id) VALUES ${values} ON CONFLICT DO NOTHING`,
          [...subjectIds, replacementId]
        );
      }
    }
    if (scheduleTeacherReady) {
      await client.query("UPDATE class_schedules SET teacher_id = $1 WHERE teacher_id = $2", [replacementId, id]);
    }

    await client.query("COMMIT");
    return NextResponse.json({
      success: true,
      teacher: teacherResult.rows[0].username,
      transferred_subjects: subjectIds.length,
      replacement_teacher_id: replacementId,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("POST /api/users/[id]/resign error:", error);
    return NextResponse.json({ error: "Unable to resign teacher" }, { status: 500 });
  } finally {
    client.release();
  }
}
