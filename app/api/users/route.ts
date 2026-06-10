import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/app/lib/verifyAdmin";
import { adminAuth } from "@/app/lib/firebase-admin";
import pool from "@/app/lib/db";

export async function GET(req: NextRequest) {
  if (!await verifyAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await pool.query(
    "SELECT id, firebase_uid, username, role, student_id, homeroom_classroom_id, subjects FROM users ORDER BY role, username"
  );
  return NextResponse.json(result.rows);
}

export async function POST(req: NextRequest) {
  if (!await verifyAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { username, password, role, student_id, homeroom_classroom_id, subjects } = await req.json();

  if (!username?.trim() || !password?.trim() || !role) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const email = `${username.trim()}@school.local`;

  // สร้างใน Firebase Auth
  let firebaseUser;
  try {
    firebaseUser = await adminAuth.createUser({ email, password, displayName: username.trim() });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Firebase error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  // Insert ลง DB
  const result = await pool.query(
    `INSERT INTO users (firebase_uid, username, role, student_id, homeroom_classroom_id, subjects)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, firebase_uid, username, role, student_id, homeroom_classroom_id, subjects`,
    [firebaseUser.uid, username.trim(), role, student_id ?? null, homeroom_classroom_id ?? null, subjects ?? null]
  );

  // ถ้าเป็น student ให้สร้างในตาราง students อัตโนมัติ
  if (role === "student" && student_id) {
    try {
      const checkRes = await pool.query("SELECT id FROM students WHERE student_id = $1", [student_id]);
      if (checkRes.rows.length === 0) {
        await pool.query(
          "INSERT INTO students (name, student_id, classroom_id) VALUES ($1, $2, null)",
          [username.trim(), student_id.trim()]
        );
      }
    } catch (err) {
      console.error("Error auto-inserting student on user creation:", err);
    }
  }

  return NextResponse.json(result.rows[0], { status: 201 });
}
