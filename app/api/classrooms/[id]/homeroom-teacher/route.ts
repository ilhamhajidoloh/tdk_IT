import { NextRequest, NextResponse } from "next/server";
import pool from "@/app/lib/db";
import { requirePermission } from "@/app/lib/permissions/middleware";
import { getSchoolContext } from "@/app/lib/schoolContext";
import { ensureStatusSchema } from "@/app/lib/statusMigration";

const DEFAULT_SCHOOL_ID = "00000000-0000-0000-0000-000000000001";

// แทนที่รายชื่อครูประจำชั้นทั้งหมดของชั้นเรียนนี้ (1 ชั้นมีได้หลายคน แต่ครู 1 คนประจำได้ 1 ชั้นต่อเทอม)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permError = await requirePermission(req, "classrooms.edit");
  if (permError) return permError;

  await ensureStatusSchema();
  const { id } = await params;
  const body = await req.json();
  const schoolId = (await getSchoolContext(req))?.schoolId || DEFAULT_SCHOOL_ID;

  const rawIds: unknown[] = Array.isArray(body.teacher_ids) ? body.teacher_ids : [];
  const teacherIds = [...new Set(
    rawIds.filter((v): v is string => typeof v === "string" && v.trim() !== "").map(v => v.trim())
  )];

  const classroom = await pool.query(
    `SELECT id, name, setting_id FROM classrooms
      WHERE id = $1 AND (school_id = $2 OR school_id IS NULL)`,
    [id, schoolId]
  );
  if (classroom.rows.length === 0) {
    return NextResponse.json({ error: "Classroom not found" }, { status: 404 });
  }
  const settingId = classroom.rows[0].setting_id;
  if (settingId == null) {
    return NextResponse.json({ error: "ชั้นเรียนนี้ยังไม่ได้ผูกกับเทอม/ปีการศึกษา" }, { status: 400 });
  }

  if (teacherIds.length > 0) {
    const valid = await pool.query(
      `SELECT id FROM users
        WHERE id = ANY($1::uuid[]) AND role = 'teacher' AND COALESCE(status, 'active') = 'active'
          AND (school_id = $2 OR school_id IS NULL)`,
      [teacherIds, schoolId]
    );
    if (valid.rows.length !== teacherIds.length) {
      return NextResponse.json({ error: "พบครูที่ไม่มีอยู่ในระบบหรือพ้นสภาพแล้ว" }, { status: 400 });
    }

    const conflicts = await pool.query(
      `SELECT u.username, c.name AS classroom_name
         FROM classroom_homeroom_teachers cht
         JOIN users u ON u.id = cht.teacher_id
         JOIN classrooms c ON c.id = cht.classroom_id
        WHERE cht.teacher_id = ANY($1::uuid[]) AND cht.setting_id = $2 AND cht.classroom_id <> $3`,
      [teacherIds, settingId, id]
    );
    if (conflicts.rows.length > 0) {
      const list = conflicts.rows.map((r: { username: string; classroom_name: string }) => `${r.username} (${r.classroom_name})`).join(", ");
      return NextResponse.json(
        { error: `ครูต่อไปนี้เป็นครูประจำชั้นห้องอื่นในเทอมนี้แล้ว: ${list}` },
        { status: 409 }
      );
    }
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM classroom_homeroom_teachers WHERE classroom_id = $1", [id]);
    if (teacherIds.length > 0) {
      await client.query(
        `INSERT INTO classroom_homeroom_teachers (classroom_id, teacher_id, setting_id)
         SELECT $1, t, $2 FROM unnest($3::uuid[]) AS t`,
        [id, settingId, teacherIds]
      );
    }
    await client.query("COMMIT");
  } catch (err: unknown) {
    await client.query("ROLLBACK");
    // ชนกับ unique (teacher_id, setting_id) จากการบันทึกพร้อมกันอีกหน้าต่างหนึ่ง
    if ((err as { code?: string })?.code === "23505") {
      return NextResponse.json({ error: "ครูบางคนเป็นครูประจำชั้นห้องอื่นในเทอมนี้แล้ว" }, { status: 409 });
    }
    console.error("Failed to save homeroom teachers:", err);
    return NextResponse.json({ error: "บันทึกครูประจำชั้นไม่สำเร็จ" }, { status: 500 });
  } finally {
    client.release();
  }

  return NextResponse.json({ id, setting_id: settingId, homeroom_teacher_ids: teacherIds });
}
