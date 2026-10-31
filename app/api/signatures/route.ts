import { NextRequest, NextResponse } from "next/server";
import pool from "@/app/lib/db";
import { ensureStatusSchema } from "@/app/lib/statusMigration";
import { getSchoolContext } from "@/app/lib/schoolContext";
import { uploadSignatureToOracle, deleteSignatureFromOracle, getOracleStorageConfig } from "@/app/lib/oracleStorage";
import { processSignatureImage, ALLOWED_IMAGE_MIMES, isHeicFile } from "@/app/lib/imageProcessing";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB (รองรับรูปถ่ายความละเอียดสูงจาก iPhone/iPad)

export async function POST(req: NextRequest) {
  try {
    await ensureStatusSchema();
    const context = await getSchoolContext(req);
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { isConfigured } = getOracleStorageConfig();
    if (!isConfigured) {
      return NextResponse.json(
        {
          error: "Oracle Storage is not configured yet. Please configure OCI_STORAGE_* variables in .env.local",
        },
        { status: 503 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const type = formData.get("type") as string | null;
    const settingId = formData.get("settingId") as string | null;
    const teacherId = formData.get("teacherId") as string | null;

    if (!file || !type || !settingId) {
      return NextResponse.json(
        { error: "Missing required fields: file, type, and settingId" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const rawBuffer = Buffer.from(arrayBuffer);
    const timestamp = Date.now();

    const isSupported =
      ALLOWED_IMAGE_MIMES.includes(file.type) ||
      isHeicFile(rawBuffer, file.name, file.type);

    if (!isSupported) {
      return NextResponse.json(
        { error: "Invalid file format. Only PNG, JPEG, WebP, and HEIC/HEIF (iOS) are allowed." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds 10MB limit." },
        { status: 400 }
      );
    }

    let schoolId = context.schoolId;
    if (context.isSuperAdmin && formData.get("schoolId")) {
      schoolId = formData.get("schoolId") as string;
    }
    if (!schoolId) {
      schoolId = "00000000-0000-0000-0000-000000000001";
    }

    // Process & convert image (convert HEIC from iPhone/iPad to PNG)
    const { buffer, contentType } = await processSignatureImage(
      rawBuffer,
      file.name,
      file.type
    );

    if (type === "academic_head") {
      // Must have permission to edit settings
      if (!context.canAccessAdmin && !context.isSuperAdmin) {
        return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
      }

      const key = `signatures/schools/${schoolId}/terms/${settingId}/academic_head_${timestamp}.png`;
      await uploadSignatureToOracle(buffer, key, contentType);

      // Fetch previous key to delete old file if exists
      const oldRes = await pool.query(
        "SELECT academic_head_signature_key FROM system_settings WHERE id = $1 AND (school_id = $2 OR school_id IS NULL)",
        [settingId, schoolId]
      );
      const oldKey = oldRes.rows[0]?.academic_head_signature_key;

      await pool.query(
        "UPDATE system_settings SET academic_head_signature_key = $1 WHERE id = $2 AND (school_id = $3 OR school_id IS NULL)",
        [key, settingId, schoolId]
      );

      if (oldKey && oldKey !== key) {
        try {
          await deleteSignatureFromOracle(oldKey);
        } catch (delErr) {
          console.warn("Could not delete old signature from storage:", delErr);
        }
      }

      return NextResponse.json({
        success: true,
        type: "academic_head",
        key,
        url: `/api/signatures/proxy?type=academic_head&id=${settingId}&t=${timestamp}`,
      });
    } else if (type === "teacher") {
      if (!teacherId) {
        return NextResponse.json({ error: "teacherId is required for teacher signatures" }, { status: 400 });
      }

      // Check permission: either Admin/Co-admin or the teacher themself
      const isOwner = context.userId === teacherId;
      if (!context.canAccessAdmin && !isOwner) {
        return NextResponse.json({ error: "Forbidden: You cannot upload signature for this teacher" }, { status: 403 });
      }

      const key = `signatures/schools/${schoolId}/terms/${settingId}/teachers/${teacherId}_${timestamp}.png`;
      await uploadSignatureToOracle(buffer, key, contentType);

      // Check old key
      const oldRes = await pool.query(
        "SELECT signature_key FROM teacher_term_signatures WHERE school_id = $1 AND user_id = $2 AND setting_id = $3",
        [schoolId, teacherId, settingId]
      );
      const oldKey = oldRes.rows[0]?.signature_key;

      // Upsert into teacher_term_signatures
      await pool.query(
        `INSERT INTO teacher_term_signatures (school_id, user_id, setting_id, signature_key, updated_at)
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT (user_id, setting_id)
         DO UPDATE SET signature_key = EXCLUDED.signature_key, updated_at = NOW()`,
        [schoolId, teacherId, settingId, key]
      );

      if (oldKey && oldKey !== key) {
        try {
          await deleteSignatureFromOracle(oldKey);
        } catch (delErr) {
          console.warn("Could not delete old teacher signature from storage:", delErr);
        }
      }

      return NextResponse.json({
        success: true,
        type: "teacher",
        key,
        url: `/api/signatures/proxy?type=teacher&id=${teacherId}&settingId=${settingId}&t=${timestamp}`,
      });
    }

    return NextResponse.json({ error: "Invalid signature type" }, { status: 400 });
  } catch (error: unknown) {
    console.error("Error uploading signature:", error);
    return NextResponse.json(
      { error: "Failed to upload signature", details: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await ensureStatusSchema();
    const context = await getSchoolContext(req);
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const settingId = searchParams.get("settingId");
    const teacherId = searchParams.get("teacherId");

    if (!type || !settingId) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    let schoolId = context.schoolId;
    if (context.isSuperAdmin && searchParams.get("schoolId")) {
      schoolId = searchParams.get("schoolId");
    }
    if (!schoolId) {
      schoolId = "00000000-0000-0000-0000-000000000001";
    }

    if (type === "academic_head") {
      if (!context.canAccessAdmin && !context.isSuperAdmin) {
        return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
      }

      const res = await pool.query(
        "SELECT academic_head_signature_key FROM system_settings WHERE id = $1 AND (school_id = $2 OR school_id IS NULL)",
        [settingId, schoolId]
      );
      const oldKey = res.rows[0]?.academic_head_signature_key;

      await pool.query(
        "UPDATE system_settings SET academic_head_signature_key = NULL WHERE id = $1 AND (school_id = $2 OR school_id IS NULL)",
        [settingId, schoolId]
      );

      if (oldKey) {
        try {
          await deleteSignatureFromOracle(oldKey);
        } catch (delErr) {
          console.warn("Could not delete from storage:", delErr);
        }
      }

      return NextResponse.json({ success: true, message: "Academic head signature removed" });
    } else if (type === "teacher") {
      if (!teacherId) {
        return NextResponse.json({ error: "teacherId is required" }, { status: 400 });
      }

      const isOwner = context.userId === teacherId;
      if (!context.canAccessAdmin && !isOwner) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const res = await pool.query(
        "SELECT signature_key FROM teacher_term_signatures WHERE school_id = $1 AND user_id = $2 AND setting_id = $3",
        [schoolId, teacherId, settingId]
      );
      const oldKey = res.rows[0]?.signature_key;

      await pool.query(
        "DELETE FROM teacher_term_signatures WHERE school_id = $1 AND user_id = $2 AND setting_id = $3",
        [schoolId, teacherId, settingId]
      );

      if (oldKey) {
        try {
          await deleteSignatureFromOracle(oldKey);
        } catch (delErr) {
          console.warn("Could not delete from storage:", delErr);
        }
      }

      return NextResponse.json({ success: true, message: "Teacher signature removed for this term" });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error: unknown) {
    console.error("Error deleting signature:", error);
    return NextResponse.json(
      { error: "Failed to delete signature", details: (error as Error).message },
      { status: 500 }
    );
  }
}

