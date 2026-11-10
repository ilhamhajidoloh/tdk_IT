import { NextRequest, NextResponse } from "next/server";
import pool from "@/app/lib/db";
import { ensureStatusSchema } from "@/app/lib/statusMigration";
import { getSchoolContext } from "@/app/lib/schoolContext";
import {
  deleteSignatureFromOracle,
  getOracleStorageConfig,
  getSignatureFromOracle,
  uploadSignatureToOracle,
} from "@/app/lib/oracleStorage";

const DEFAULT_SCHOOL_ID = "00000000-0000-0000-0000-000000000001";

function normalizePersonName(value: unknown) {
  return String(value || "")
    .normalize("NFKC")
    .replace(/\s+/g, "")
    .toLocaleLowerCase("th-TH");
}

export async function POST(req: NextRequest) {
  try {
    await ensureStatusSchema();
    const context = await getSchoolContext(req);
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!context.canAccessAdmin && !context.isSuperAdmin) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { isConfigured } = getOracleStorageConfig();
    if (!isConfigured) {
      return NextResponse.json({ error: "Oracle Storage is not configured" }, { status: 503 });
    }

    const body = await req.json();
    const settingId = String(body.settingId || "");
    const teacherId = body.teacherId ? String(body.teacherId) : null;
    const targetType = body.targetType === "teacher" ? "teacher" : "academic_head";
    let schoolId = context.schoolId;
    if (context.isSuperAdmin && body.schoolId) schoolId = String(body.schoolId);
    if (!schoolId) schoolId = DEFAULT_SCHOOL_ID;

    if (!settingId) {
      return NextResponse.json({ error: "settingId is required" }, { status: 400 });
    }

    if (targetType === "teacher") {
      if (!teacherId) {
        return NextResponse.json({ error: "teacherId is required" }, { status: 400 });
      }

      const teacherRes = await pool.query(
        `SELECT username FROM users
         WHERE id = $1 AND role = 'teacher' AND (school_id = $2 OR school_id IS NULL)`,
        [teacherId, schoolId]
      );
      if (!teacherRes.rows[0]) {
        return NextResponse.json({ error: "ไม่พบข้อมูลครูที่เลือก" }, { status: 404 });
      }

      const sourceRes = await pool.query(
        `SELECT tts.signature_key, ss.academic_year, ss.term
         FROM teacher_term_signatures tts
         JOIN system_settings ss ON ss.id = tts.setting_id
         WHERE tts.school_id = $1
           AND tts.user_id = $2
           AND tts.setting_id <> $3
           AND tts.signature_key IS NOT NULL
         ORDER BY tts.updated_at DESC
         LIMIT 1`,
        [schoolId, teacherId, settingId]
      );
      const source = sourceRes.rows[0];
      if (!source?.signature_key) {
        return NextResponse.json(
          { error: "ยังไม่พบลายเซ็นของครูคนนี้จากภาคเรียนก่อน" },
          { status: 404 }
        );
      }

      const file = await getSignatureFromOracle(source.signature_key);
      if (!file) {
        return NextResponse.json({ error: "ไม่พบไฟล์ลายเซ็นเดิมใน Cloud Storage" }, { status: 404 });
      }

      const timestamp = Date.now();
      const newKey = `signatures/schools/${schoolId}/terms/${settingId}/teachers/${teacherId}_${timestamp}.png`;
      await uploadSignatureToOracle(file.buffer, newKey, file.contentType);

      const oldRes = await pool.query(
        `SELECT signature_key FROM teacher_term_signatures
         WHERE school_id = $1 AND user_id = $2 AND setting_id = $3`,
        [schoolId, teacherId, settingId]
      );
      const oldKey = oldRes.rows[0]?.signature_key;

      await pool.query(
        `INSERT INTO teacher_term_signatures
           (school_id, user_id, setting_id, signature_key, updated_at)
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT (user_id, setting_id)
         DO UPDATE SET signature_key = EXCLUDED.signature_key, updated_at = NOW()`,
        [schoolId, teacherId, settingId, newKey]
      );

      if (oldKey && oldKey !== newKey) {
        try {
          await deleteSignatureFromOracle(oldKey);
        } catch (error) {
          console.warn("Could not delete replaced teacher signature:", error);
        }
      }

      return NextResponse.json({
        success: true,
        sourceTerm: `${source.term}/${source.academic_year}`,
      });
    }

    const targetRes = await pool.query(
      `SELECT ss.academic_head, ss.academic_head_signature_key
       FROM system_settings ss
       WHERE ss.id = $1
         AND (ss.school_id = $2 OR ss.school_id IS NULL)`,
      [settingId, schoolId]
    );
    const target = targetRes.rows[0];
    if (!target) {
      return NextResponse.json({ error: "ไม่พบข้อมูลภาคเรียนที่เลือก" }, { status: 404 });
    }
    if (!normalizePersonName(target.academic_head)) {
      return NextResponse.json({ error: "กรุณาระบุชื่อหัวหน้าฝ่ายวิชาการก่อน" }, { status: 400 });
    }

    let source: {
      setting_id: string;
      signature_key: string;
      academic_year: string;
      term: string;
      source_type: "teacher" | "academic_head";
    } | undefined;

    if (teacherId) {
      const teacherRes = await pool.query(
        `SELECT username FROM users
         WHERE id = $1 AND role = 'teacher' AND (school_id = $2 OR school_id IS NULL)`,
        [teacherId, schoolId]
      );
      const teacher = teacherRes.rows[0];
      if (
        teacher &&
        normalizePersonName(teacher.username) === normalizePersonName(target.academic_head)
      ) {
        const sourceRes = await pool.query(
          `SELECT tts.setting_id, tts.signature_key, ss.academic_year, ss.term
           FROM teacher_term_signatures tts
           JOIN system_settings ss ON ss.id = tts.setting_id
           WHERE tts.school_id = $1
             AND tts.user_id = $2
             AND tts.signature_key IS NOT NULL
           ORDER BY (tts.setting_id = $3) DESC, tts.updated_at DESC
           LIMIT 1`,
          [schoolId, teacherId, settingId]
        );
        if (sourceRes.rows[0]) {
          source = { ...sourceRes.rows[0], source_type: "teacher" };
        }
      }
    }

    if (!source) {
      const previousHeadsRes = await pool.query(
        `SELECT id AS setting_id, academic_head, academic_head_signature_key AS signature_key,
                academic_year, term
         FROM system_settings
         WHERE id <> $1
           AND (school_id = $2 OR school_id IS NULL)
           AND academic_head_signature_key IS NOT NULL
         ORDER BY id DESC`,
        [settingId, schoolId]
      );
      const previousHead = previousHeadsRes.rows.find(
        (row) =>
          normalizePersonName(row.academic_head) === normalizePersonName(target.academic_head)
      );
      if (previousHead) {
        source = { ...previousHead, source_type: "academic_head" };
      }
    }

    if (!source?.signature_key) {
      return NextResponse.json(
        { error: "ยังไม่พบลายเซ็นของหัวหน้าฝ่ายคนนี้จากภาคเรียนก่อน" },
        { status: 404 }
      );
    }

    const file = await getSignatureFromOracle(source.signature_key);
    if (!file) {
      return NextResponse.json({ error: "ไม่พบไฟล์ลายเซ็นเดิมใน Cloud Storage" }, { status: 404 });
    }

    const timestamp = Date.now();
    const newKey = `signatures/schools/${schoolId}/terms/${settingId}/academic_head_${timestamp}.png`;
    await uploadSignatureToOracle(file.buffer, newKey, file.contentType);

    let teacherKey: string | null = null;
    let oldTeacherKey: string | null = null;
    if (teacherId && source.source_type === "teacher" && String(source.setting_id) !== settingId) {
      const oldTeacherRes = await pool.query(
        `SELECT signature_key
         FROM teacher_term_signatures
         WHERE school_id = $1 AND user_id = $2 AND setting_id = $3`,
        [schoolId, teacherId, settingId]
      );
      oldTeacherKey = oldTeacherRes.rows[0]?.signature_key || null;
      teacherKey = `signatures/schools/${schoolId}/terms/${settingId}/teachers/${teacherId}_${timestamp}.png`;
      await uploadSignatureToOracle(file.buffer, teacherKey, file.contentType);
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `UPDATE system_settings
         SET academic_head_signature_key = $1
         WHERE id = $2 AND (school_id = $3 OR school_id IS NULL)`,
        [newKey, settingId, schoolId]
      );
      if (teacherKey) {
        await client.query(
          `INSERT INTO teacher_term_signatures
             (school_id, user_id, setting_id, signature_key, updated_at)
           VALUES ($1, $2, $3, $4, NOW())
           ON CONFLICT (user_id, setting_id)
           DO UPDATE SET signature_key = EXCLUDED.signature_key, updated_at = NOW()`,
          [schoolId, teacherId, settingId, teacherKey]
        );
      }
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

    const oldKey = target.academic_head_signature_key;
    if (oldKey && oldKey !== newKey) {
      try {
        await deleteSignatureFromOracle(oldKey);
      } catch (error) {
        console.warn("Could not delete replaced academic head signature:", error);
      }
    }
    if (oldTeacherKey && oldTeacherKey !== teacherKey) {
      try {
        await deleteSignatureFromOracle(oldTeacherKey);
      } catch (error) {
        console.warn("Could not delete replaced teacher signature:", error);
      }
    }

    return NextResponse.json({
      success: true,
      sourceTerm: `${source.term}/${source.academic_year}`,
      url: `/api/signatures/proxy?type=academic_head&id=${settingId}&t=${timestamp}`,
    });
  } catch (error: unknown) {
    console.error("Error copying teacher signature:", error);
    return NextResponse.json(
      { error: "Failed to copy signature", details: (error as Error).message },
      { status: 500 }
    );
  }
}
