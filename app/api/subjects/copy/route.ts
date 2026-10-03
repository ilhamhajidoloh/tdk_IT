import { NextRequest, NextResponse } from "next/server";
import pool from "@/app/lib/db";
import { requirePermission } from "@/app/lib/permissions/middleware";
import { getSchoolContext } from "@/app/lib/schoolContext";

const DEFAULT_SCHOOL_ID = "00000000-0000-0000-0000-000000000001";

async function hasTranslationsTable() {
  try {
    await pool.query("SELECT 1 FROM translations LIMIT 0");
    return true;
  } catch {
    return false;
  }
}

// คัดลอกรายวิชาไปยังเทอม/ปีอื่น: คัดลอกเฉพาะชื่อวิชา ภาษา (คำแปล) หน่วยกิต และคะแนนเต็มเก็บ/สอบ
// ไม่คัดลอกชั้นเรียนและครูผู้สอน
export async function POST(req: NextRequest) {
  const permError = await requirePermission(req, "subjects.create");
  if (permError) return permError;

  const { source_setting_id, target_setting_id, subject_ids } = await req.json();
  const schoolId = (await getSchoolContext(req))?.schoolId || DEFAULT_SCHOOL_ID;

  if (!source_setting_id || !target_setting_id || !Array.isArray(subject_ids) || subject_ids.length === 0) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  if (String(source_setting_id) === String(target_setting_id)) {
    return NextResponse.json({ error: "Source and target term must differ" }, { status: 400 });
  }

  // Load source subjects from DB (don't trust client-sent values)
  const src = await pool.query(
    `SELECT id, name, midterm_max_score, final_max_score, subject_type, credit_hours
     FROM subjects
     WHERE id::text = ANY($1::text[]) AND setting_id = $2 AND (school_id = $3 OR school_id IS NULL)`,
    [subject_ids.map(String), source_setting_id, schoolId]
  );

  // Existing subject names in target term (skip duplicates)
  const existing = await pool.query(
    "SELECT name FROM subjects WHERE setting_id = $1 AND (school_id = $2 OR school_id IS NULL)",
    [target_setting_id, schoolId]
  );
  const existingNames = new Set(existing.rows.map((r: any) => String(r.name).trim().toLowerCase()));

  const translationsReady = await hasTranslationsTable();

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    let created = 0;
    let skipped = 0;

    for (const sub of src.rows) {
      const name = String(sub.name || "").trim();
      if (!name || existingNames.has(name.toLowerCase())) {
        skipped++;
        continue;
      }

      const inserted = await client.query(
        `INSERT INTO subjects (name, teacher_id, setting_id, midterm_max_score, final_max_score, subject_type, credit_hours, school_id)
         VALUES ($1, NULL, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [
          name,
          target_setting_id,
          sub.midterm_max_score ?? 50,
          sub.final_max_score ?? 50,
          sub.subject_type ?? "main",
          sub.credit_hours ?? 1,
          schoolId,
        ]
      );
      const newSubjectId = inserted.rows[0].id;
      existingNames.add(name.toLowerCase());
      created++;

      // Copy subject-specific translation (key 'subj_<id>').
      // Name-keyed translations already apply to the new subject because it has the same name.
      if (translationsReady) {
        await client.query(
          `INSERT INTO translations (key, thai, malay_rumi, malay_jawi)
           SELECT 'subj_' || $2::text, thai, malay_rumi, malay_jawi
           FROM translations WHERE key = 'subj_' || $1::text
           ON CONFLICT (key) DO NOTHING`,
          [sub.id, newSubjectId]
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
