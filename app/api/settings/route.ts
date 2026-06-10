import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/app/lib/firebase-admin";
import pool from "@/app/lib/db";

function formatRow(row: Record<string, unknown>) {
  if (!row) return row;
  return {
    ...row,
    start_date: row.start_date instanceof Date
      ? row.start_date.toISOString().split("T")[0]
      : row.start_date ?? null,
    end_date: row.end_date instanceof Date
      ? row.end_date.toISOString().split("T")[0]
      : row.end_date ?? null,
  };
}

export async function GET(req: NextRequest) {
  // ตรวจสอบ token
  const token = req.headers.get("Authorization")?.split("Bearer ")[1];
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    const userResult = await pool.query(
      "SELECT role FROM users WHERE firebase_uid = $1",
      [decoded.uid]
    );
    if (userResult.rows.length === 0 || userResult.rows[0].role !== "admin") {
      return NextResponse.json({ error: "Forbidden — admin only" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const result = await pool.query("SELECT * FROM system_settings ORDER BY academic_year DESC, term DESC");
  return NextResponse.json(result.rows.map(formatRow));
}

export async function PUT(req: NextRequest) {
  // ตรวจสอบ token
  const token = req.headers.get("Authorization")?.split("Bearer ")[1];
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    const userResult = await pool.query(
      "SELECT role FROM users WHERE firebase_uid = $1",
      [decoded.uid]
    );
    if (userResult.rows.length === 0 || userResult.rows[0].role !== "admin") {
      return NextResponse.json({ error: "Forbidden — admin only" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const { id, academic_year, term, start_date, end_date } = await req.json();

  if (!academic_year || !term || !start_date || !end_date) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (start_date > end_date) {
    return NextResponse.json({ error: "start_date must not be after end_date" }, { status: 400 });
  }

  if (id) {
    // Update
    const result = await pool.query(
      `UPDATE system_settings
       SET academic_year = $1, term = $2, start_date = $3, end_date = $4
       WHERE id = $5
       RETURNING *`,
      [academic_year, term, start_date, end_date, id]
    );
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Setting not found" }, { status: 444 });
    }
    return NextResponse.json(formatRow(result.rows[0]));
  } else {
    // Create
    const result = await pool.query(
      `INSERT INTO system_settings (academic_year, term, start_date, end_date, is_active)
       VALUES ($1, $2, $3, $4, false)
       RETURNING *`,
      [academic_year, term, start_date, end_date]
    );
    return NextResponse.json(formatRow(result.rows[0]));
  }
}

export async function DELETE(req: NextRequest) {
  // ตรวจสอบ token
  const token = req.headers.get("Authorization")?.split("Bearer ")[1];
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    const userResult = await pool.query(
      "SELECT role FROM users WHERE firebase_uid = $1",
      [decoded.uid]
    );
    if (userResult.rows.length === 0 || userResult.rows[0].role !== "admin") {
      return NextResponse.json({ error: "Forbidden — admin only" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing id parameter" }, { status: 400 });
  }

  // ตรวจสอบว่ากำลังลบปีการศึกษาที่ใช้อยู่หรือไม่
  const checkActive = await pool.query("SELECT is_active FROM system_settings WHERE id = $1", [id]);
  if (checkActive.rows.length > 0 && checkActive.rows[0].is_active) {
    return NextResponse.json({ error: "Cannot delete the active academic year" }, { status: 400 });
  }

  await pool.query("DELETE FROM system_settings WHERE id = $1", [id]);
  return NextResponse.json({ success: true });
}

