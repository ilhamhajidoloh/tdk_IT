import { NextRequest, NextResponse } from "next/server";
import pool from "@/app/lib/db";
import bcrypt from "bcrypt";
import { getSchoolContext } from "@/app/lib/schoolContext";

export async function GET(req: NextRequest) {
  const context = await getSchoolContext(req);
  if (!context?.isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden: Super Admin only" }, { status: 403 });
  }

  try {
    const result = await pool.query(`
      SELECT u.id, u.username, u.email, u.role, u.school_id, u.created_at,
             s.name AS school_name, s.subdomain
      FROM users u
      LEFT JOIN schools s ON s.id = u.school_id
      WHERE u.role IN ('admin', 'super_admin')
      ORDER BY u.role DESC, s.name ASC, u.username ASC
    `);
    return NextResponse.json(result.rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const context = await getSchoolContext(req);
  if (!context?.isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden: Super Admin only" }, { status: 403 });
  }

  const { username, password, email, school_id } = await req.json();

  if (!username?.trim() || !password?.trim() || !school_id) {
    return NextResponse.json(
      { error: "กรุณากรอก Username, Password และเลือกโรงเรียน" },
      { status: 400 }
    );
  }

  try {
    const hashedPassword = await bcrypt.hash(password.trim(), 10);
    const result = await pool.query(
      `INSERT INTO users (username, password, role, email, school_id)
       VALUES ($1, $2, 'admin', $3, $4)
       RETURNING id, username, role, email, school_id, created_at`,
      [username.trim(), hashedPassword, email?.trim() || null, school_id]
    );

    // Activate the school once admin user is created
    await pool.query("UPDATE public.schools SET is_active = true WHERE id = $1", [school_id]);

    // Delete matching school request as requested
    await pool.query(
      `DELETE FROM public.school_creation_requests
       WHERE LOWER(subdomain) IN (SELECT LOWER(subdomain) FROM public.schools WHERE id = $1)`,
      [school_id]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error: any) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Username หรือ Email นี้ถูกใช้งานในระบบแล้ว" }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
