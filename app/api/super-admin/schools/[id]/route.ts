import { NextRequest, NextResponse } from "next/server";
import pool from "@/app/lib/db";
import { getSchoolContext } from "@/app/lib/schoolContext";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const context = await getSchoolContext();
  if (!context || !context.isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden: Super Admin only" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const { name, name_en, subdomain, logo_url, address, phone, email, is_active, enabled_modules } = body;

    const modulesJson = enabled_modules !== undefined ? JSON.stringify(enabled_modules) : null;

    const result = await pool.query(
      `UPDATE public.schools
       SET name = COALESCE($1, name),
           name_en = COALESCE($2, name_en),
           subdomain = COALESCE($3, subdomain),
           logo_url = COALESCE($4, logo_url),
           address = COALESCE($5, address),
           phone = COALESCE($6, phone),
           email = COALESCE($7, email),
           is_active = COALESCE($8, is_active),
           enabled_modules = COALESCE($9::jsonb, enabled_modules),
           updated_at = NOW()
       WHERE id = $10
       RETURNING *`,
      [name, name_en, subdomain ? subdomain.trim().toLowerCase() : null, logo_url, address, phone, email, is_active, modulesJson, id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update school" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const context = await getSchoolContext();
  if (!context || !context.isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden: Super Admin only" }, { status: 403 });
  }

  const { id } = await params;

  try {
    // Only allow delete if admin has formally requested it
    const check = await pool.query(
      "SELECT id, name, deletion_requested FROM public.schools WHERE id = $1",
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

    // Hard delete the school (CASCADE will remove related users, etc.)
    await pool.query("DELETE FROM public.schools WHERE id = $1", [id]);

    return NextResponse.json({ success: true, message: `ลบโรงเรียน "${check.rows[0].name}" เรียบร้อยแล้ว` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete school" }, { status: 500 });
  }
}
