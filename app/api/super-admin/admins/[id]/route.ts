import { NextRequest, NextResponse } from "next/server";
import pool from "@/app/lib/db";
import bcrypt from "bcrypt";
import { getSchoolContext } from "@/app/lib/schoolContext";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const context = await getSchoolContext();
  if (!context?.isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden: Super Admin only" }, { status: 403 });
  }

  const { id } = await params;
  const { username, password, email, school_id } = await req.json();

  try {
    let query = "";
    const queryParams: any[] = [];

    if (password && password.trim()) {
      const hashedPassword = await bcrypt.hash(password.trim(), 10);
      query = `UPDATE users 
               SET username = COALESCE($1, username), 
                   password = $2, 
                   email = $3, 
                   school_id = COALESCE($4, school_id) 
               WHERE id = $5 AND role = 'admin'
               RETURNING id, username, role, email, school_id`;
      queryParams.push(username?.trim() || null, hashedPassword, email?.trim() || null, school_id || null, id);
    } else {
      query = `UPDATE users 
               SET username = COALESCE($1, username), 
                   email = $2, 
                   school_id = COALESCE($3, school_id) 
               WHERE id = $4 AND role = 'admin'
               RETURNING id, username, role, email, school_id`;
      queryParams.push(username?.trim() || null, email?.trim() || null, school_id || null, id);
    }

    const result = await pool.query(query, queryParams);
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Admin user not found" }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error: any) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Username หรือ Email นี้ถูกใช้งานแล้ว" }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const context = await getSchoolContext();
  if (!context?.isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden: Super Admin only" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const result = await pool.query(
      "DELETE FROM users WHERE id = $1 AND role = 'admin' RETURNING id",
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Admin user not found or cannot be deleted" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
