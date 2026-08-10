import { NextRequest, NextResponse } from "next/server";
import pool from "@/app/lib/db";
import bcrypt from "bcrypt";

export async function POST(req: NextRequest) {
  try {
    const { request_id, username, password, email } = await req.json();

    if (!request_id || !username?.trim() || !password?.trim()) {
      return NextResponse.json({ error: "กรุณาระบุข้อมูลให้ครบถ้วน (Username และ Password)" }, { status: 400 });
    }

    // 1. Check if the school request is approved
    const requestResult = await pool.query(
      "SELECT id, school_name, subdomain, status FROM public.school_creation_requests WHERE id = $1 LIMIT 1",
      [request_id]
    );

    const request = requestResult.rows[0];
    if (!request) {
      return NextResponse.json({ error: "ไม่พบคำขอสร้างโรงเรียน" }, { status: 404 });
    }
    if (request.status !== "approved") {
      return NextResponse.json({ error: "คำขอนี้ยังไม่ได้รับการอนุมัติจาก Super Admin" }, { status: 400 });
    }

    // 2. Find matching school in public.schools
    const schoolResult = await pool.query(
      "SELECT id, name, subdomain, is_active FROM public.schools WHERE LOWER(subdomain) = LOWER($1) LIMIT 1",
      [request.subdomain]
    );

    const school = schoolResult.rows[0];
    if (!school) {
      return NextResponse.json({ error: "ไม่พบข้อมูลโรงเรียนในระบบ" }, { status: 404 });
    }

    // 3. Check if admin already exists for this school
    const existingAdmin = await pool.query(
      "SELECT id FROM public.users WHERE school_id = $1 AND role = 'admin' LIMIT 1",
      [school.id]
    );
    if (existingAdmin.rows.length > 0) {
      await pool.query("UPDATE public.schools SET is_active = true WHERE id = $1", [school.id]);
      return NextResponse.json({ error: "โรงเรียนนี้เปิดใช้งานและสร้างบัญชี Admin เรียบร้อยแล้ว" }, { status: 400 });
    }

    // 4. Hash password & create admin user
    const hashedPassword = await bcrypt.hash(password.trim(), 10);
    const userResult = await pool.query(
      `INSERT INTO public.users (username, password, role, email, school_id)
       VALUES ($1, $2, 'admin', $3, $4)
       RETURNING id, username, role, email, school_id, created_at`,
      [username.trim(), hashedPassword, email?.trim() || null, school.id]
    );

    // 5. Activate the school so it appears on home page
    await pool.query("UPDATE public.schools SET is_active = true WHERE id = $1", [school.id]);

    // 6. Delete the completed request as requested
    await pool.query(
      "DELETE FROM public.school_creation_requests WHERE id = $1 OR LOWER(subdomain) = LOWER($2)",
      [request_id, school.subdomain]
    );

    return NextResponse.json(
      {
        success: true,
        message: "สร้างบัญชี Admin และเปิดใช้งานโรงเรียนเรียบร้อยแล้ว",
        school: {
          id: school.id,
          name: school.name,
          subdomain: school.subdomain,
        },
        user: userResult.rows[0],
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Username หรือ Email นี้ถูกใช้งานในระบบแล้ว" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message || "ไม่สามารถสร้างบัญชี Admin ได้" }, { status: 500 });
  }
}
