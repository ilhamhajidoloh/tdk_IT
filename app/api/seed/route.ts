import { NextResponse } from "next/server";
import { adminAuth } from "@/app/lib/firebase-admin";
import pool from "@/app/lib/db";

// รันครั้งเดียวเพื่อสร้าง test users
export async function POST() {
  const usersToCreate = [
    { email: "admin@school.local",   password: "admin1234",   username: "admin",    role: "admin" },
    { email: "teacher1@school.local", password: "teacher1234", username: "teacher1", role: "teacher" },
    { email: "s001@school.local",     password: "student1234", username: "s001",     role: "student", studentId: "S001" },
  ];

  const results = [];

  for (const u of usersToCreate) {
    // สร้างใน Firebase Auth
    const firebaseUser = await adminAuth.createUser({
      email: u.email,
      password: u.password,
      displayName: u.username,
    });

    // Insert ลง CockroachDB
    await pool.query(
      `INSERT INTO users (firebase_uid, username, role, student_id)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (username) DO NOTHING`,
      [firebaseUser.uid, u.username, u.role, u.studentId ?? null]
    );

    results.push({ username: u.username, uid: firebaseUser.uid });
  }

  return NextResponse.json({ created: results });
}
