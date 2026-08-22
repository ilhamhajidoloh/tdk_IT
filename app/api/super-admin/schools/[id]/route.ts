import { NextRequest, NextResponse } from "next/server";
import pool from "@/app/lib/db";
import { getSchoolContext } from "@/app/lib/schoolContext";
import { deleteFileFromDrive } from "@/app/lib/googleDrive";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const context = await getSchoolContext(req);
  if (!context || !context.isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden: Super Admin only" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const { name, name_en, subdomain, logo_url, logo_drive_file_id, address, phone, email, is_active, enabled_modules } = body;

    const modulesJson = enabled_modules !== undefined ? JSON.stringify(enabled_modules) : null;

    // Get current school data to check for old logo
    const currentSchool = await pool.query(
      "SELECT logo_drive_file_id FROM public.schools WHERE id = $1",
      [id]
    );

    if (currentSchool.rows.length === 0) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    const oldLogoDriveFileId = currentSchool.rows[0].logo_drive_file_id;

    // If updating logo and there's an old one, delete it from Drive
    if (logo_drive_file_id && oldLogoDriveFileId && logo_drive_file_id !== oldLogoDriveFileId) {
      try {
        await deleteFileFromDrive(oldLogoDriveFileId);
      } catch (err) {
        console.error("Failed to delete old logo from Drive:", err);
        // Don't block the update if cleanup fails
      }
    }

    const finalLogoUrl = logo_url || (logo_drive_file_id ? `/api/public/schools/logo/${logo_drive_file_id}` : null);

    const result = await pool.query(
      `UPDATE public.schools
       SET name = COALESCE($1, name),
           name_en = $2,
           subdomain = COALESCE($3, subdomain),
           logo_url = $4,
           logo_drive_file_id = $5,
           address = $6,
           phone = $7,
           email = $8,
           is_active = COALESCE($9, is_active),
           enabled_modules = COALESCE($10::jsonb, enabled_modules),
           updated_at = NOW()
       WHERE id = $11
       RETURNING *`,
      [
        name,
        name_en || null,
        subdomain ? subdomain.trim().toLowerCase() : null,
        finalLogoUrl,
        logo_drive_file_id || null,
        address || null,
        phone || null,
        email || null,
        is_active,
        modulesJson,
        id,
      ]
    );

    return NextResponse.json(result.rows[0]);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update school" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const context = await getSchoolContext(req);
  if (!context || !context.isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden: Super Admin only" }, { status: 403 });
  }

  const { id } = await params;

  try {
    // Only allow delete if admin has formally requested it
    const check = await pool.query(
      "SELECT id, name, deletion_requested, logo_drive_file_id FROM public.schools WHERE id = $1",
      [id]
    );

    if (check.rows.length === 0) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    if (!check.rows[0].deletion_requested) {
      return NextResponse.json(
        { error: "ไม่สามารถลบได้: แอดมินโรงเรียนยังไม่ได้ส่งคำขอลบข้อมูล" },
        { status: 403 }
      );
    }

    // Delete logo from Google Drive if exists
    if (check.rows[0].logo_drive_file_id) {
      try {
        await deleteFileFromDrive(check.rows[0].logo_drive_file_id);
      } catch (err) {
        console.error("Failed to delete school logo from Drive:", err);
        // Continue with school deletion even if logo cleanup fails
      }
    }

    // Hard delete the school (CASCADE will remove related users, etc.)
    await pool.query("DELETE FROM public.schools WHERE id = $1", [id]);

    return NextResponse.json({ success: true, message: `ลบโรงเรียน "${check.rows[0].name}" เรียบร้อยแล้ว` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete school" }, { status: 500 });
  }
}
