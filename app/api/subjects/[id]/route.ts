import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/app/lib/verifyAdmin";
import pool from "@/app/lib/db";

async function hasSubjectTeachersTable(): Promise<boolean> {
  try {
    await pool.query("SELECT 1 FROM subject_teachers LIMIT 0");
    return true;
  } catch {
    return false;
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await verifyAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { name, teacher_ids, classroom_ids, setting_id, midterm_max_score, final_max_score, subject_type, credit_hours } = await req.json();

  if (!name?.trim()) {
    return NextResponse.json({ error: "Missing name" }, { status: 400 });
  }

  const primaryTeacherId = Array.isArray(teacher_ids) && teacher_ids.length > 0 ? teacher_ids[0] : null;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const result = await client.query(
      "UPDATE subjects SET name = $1, teacher_id = $2, setting_id = $3, midterm_max_score = $4, final_max_score = $5, subject_type = $6, credit_hours = $7 WHERE id = $8 RETURNING *",
      [name.trim(), primaryTeacherId || null, setting_id || null, midterm_max_score || null, final_max_score || null, subject_type === "activity" ? "activity" : "main", credit_hours ?? 1, id]
    );

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    await client.query("DELETE FROM subject_classrooms WHERE subject_id = $1", [id]);
    if (Array.isArray(classroom_ids) && classroom_ids.length > 0) {
      const values = classroom_ids.map((_: string, i: number) => `($1, $${i + 2})`).join(", ");
      await client.query(
        `INSERT INTO subject_classrooms (subject_id, classroom_id) VALUES ${values}`,
        [id, ...classroom_ids]
      );
    }

    const multiTeacherReady = await hasSubjectTeachersTable();
    if (multiTeacherReady) {
      await client.query("DELETE FROM subject_teachers WHERE subject_id = $1", [id]);
      if (Array.isArray(teacher_ids) && teacher_ids.length > 0) {
        const values = teacher_ids.map((_: string, i: number) => `($1, $${i + 2})`).join(", ");
        await client.query(
          `INSERT INTO subject_teachers (subject_id, user_id) VALUES ${values} ON CONFLICT DO NOTHING`,
          [id, ...teacher_ids]
        );
      }
    }

    await client.query("COMMIT");
    return NextResponse.json({ ...result.rows[0], classroom_ids: classroom_ids || [], teacher_ids: teacher_ids || [] });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("PUT /api/subjects/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await verifyAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const hasSTTable = await hasSubjectTeachersTable();
    if (hasSTTable) await client.query("DELETE FROM subject_teachers WHERE subject_id = $1", [id]);
    await client.query("DELETE FROM subject_classrooms WHERE subject_id = $1", [id]);
    await client.query("DELETE FROM class_schedules WHERE subject_id = $1", [id]);
    const result = await client.query("DELETE FROM subjects WHERE id = $1 RETURNING *", [id]);

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    const subjectName = result.rows[0].name;
    await client.query("DELETE FROM grades WHERE subject = $1", [subjectName]);
    await client.query(
      "UPDATE users SET subjects = array_remove(subjects, $1::text) WHERE $1::text = ANY(subjects)",
      [subjectName]
    );

    await client.query("COMMIT");
    return NextResponse.json({ message: "Deleted successfully" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  } finally {
    client.release();
  }
}
