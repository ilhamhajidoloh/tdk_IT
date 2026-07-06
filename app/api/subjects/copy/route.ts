import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/app/lib/verifyAdmin";
import pool from "@/app/lib/db";

export async function POST(req: NextRequest) {
  if (!await verifyAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { source_setting_id, target_setting_id, subjects } = await req.json();

  if (!source_setting_id || !target_setting_id || !Array.isArray(subjects) || subjects.length === 0) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Load classrooms in source term (old id → name)
  const srcClassrooms = await pool.query(
    "SELECT id, name FROM classrooms WHERE setting_id = $1",
    [source_setting_id]
  );
  const srcClassroomMap: Record<string, string> = {};
  srcClassrooms.rows.forEach((c: any) => { srcClassroomMap[c.id] = c.name; });

  // Load classrooms in target term (name → new id)
  const tgtClassrooms = await pool.query(
    "SELECT id, name FROM classrooms WHERE setting_id = $1",
    [target_setting_id]
  );
  const tgtClassroomByName: Record<string, string> = {};
  tgtClassrooms.rows.forEach((c: any) => { tgtClassroomByName[c.name] = c.id; });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    let created = 0;
    let skipped = 0;

    for (const sub of subjects) {
      if (!sub.name?.trim()) continue;

      // Map classroom IDs: look up by name in target term
      const newClassroomIds: string[] = [];
      for (const oldId of (sub.classroom_ids || [])) {
        const name = srcClassroomMap[oldId];
        if (name && tgtClassroomByName[name]) {
          newClassroomIds.push(tgtClassroomByName[name]);
        }
        // If classroom doesn't exist in target term, skip it
      }

      // Insert subject
      const inserted = await client.query(
        `INSERT INTO subjects (name, teacher_id, setting_id, midterm_max_score, final_max_score, subject_type, credit_hours, score_display_mode)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
        [
          sub.name.trim(),
          sub.teacher_ids?.[0] || null,
          target_setting_id,
          sub.midterm_max_score ?? 50,
          sub.final_max_score ?? 50,
          sub.subject_type ?? "main",
          sub.credit_hours ?? 1,
          sub.score_display_mode ?? "separate"
        ]
      );
      const newSubjectId = inserted.rows[0].id;
      created++;

      // Link classrooms
      if (newClassroomIds.length > 0) {
        const vals = newClassroomIds.map((_, i) => `($1, $${i + 2})`).join(", ");
        await client.query(
          `INSERT INTO subject_classrooms (subject_id, classroom_id) VALUES ${vals} ON CONFLICT DO NOTHING`,
          [newSubjectId, ...newClassroomIds]
        );
      }

      // Link teachers (subject_teachers table)
      const teacherIds: string[] = sub.teacher_ids || (sub.teacher_id ? [sub.teacher_id] : []);
      if (teacherIds.length > 0) {
        const vals = teacherIds.map((_, i) => `($1, $${i + 2})`).join(", ");
        await client.query(
          `INSERT INTO subject_teachers (subject_id, user_id) VALUES ${vals} ON CONFLICT DO NOTHING`,
          [newSubjectId, ...teacherIds]
        );
      }
    }

    await client.query("COMMIT");
    return NextResponse.json({ success: true, created, skipped });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error copying subjects:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  } finally {
    client.release();
  }
}
