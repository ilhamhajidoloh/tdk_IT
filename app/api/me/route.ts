import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/app/lib/firebase-admin";
import pool from "@/app/lib/db";

export async function GET(req: NextRequest) {
  // 1. ดึง token จาก header
  const token = req.headers.get("Authorization")?.split("Bearer ")[1];
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 2. Verify กับ Firebase Admin
  let firebaseUid: string;
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    firebaseUid = decoded.uid;
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  // 3. ดึง user จาก CockroachDB
  const result = await pool.query(
    "SELECT * FROM users WHERE firebase_uid = $1",
    [firebaseUid]
  );

  if (result.rows.length === 0) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(result.rows[0]);
}
