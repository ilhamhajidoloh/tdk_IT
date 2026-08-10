import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import pool from "@/app/lib/db";

// Endpoint สำหรับรันครั้งเดียว เพื่อสร้าง/อัปเดต Super Admin และ Test Users
export async function POST() {
  try {
    const superAdminPasswordHash = await bcrypt.hash("superadmin1234", 10);
    const adminPasswordHash = await bcrypt.hash("admin1234", 10);

    // 1. สร้าง/อัปเดต Super Admin
    await pool.query(
      `INSERT INTO users (username, password, role, school_id)
       VALUES ('superadmin', $1, 'super_admin', '00000000-0000-0000-0000-000000000001')
       ON CONFLICT (username) 
       DO UPDATE SET password = EXCLUDED.password, role = EXCLUDED.role`,
      [superAdminPasswordHash]
    );

    // 2. สร้าง/อัปเดต Admin ปกติ
    await pool.query(
      `INSERT INTO users (username, password, role, school_id)
       VALUES ('admin', $1, 'admin', '00000000-0000-0000-0000-000000000001')
       ON CONFLICT (username) 
       DO UPDATE SET password = EXCLUDED.password, role = EXCLUDED.role`,
      [adminPasswordHash]
    );

    return NextResponse.json({
      message: "Seed users completed successfully!",
      superAdmin: {
        username: "superadmin",
        password: "superadmin1234",
        role: "super_admin",
      },
      admin: {
        username: "admin",
        password: "admin1234",
        role: "admin",
      },
    });
  } catch (error: any) {
    console.error("Seed error:", error);
    return NextResponse.json({ error: error.message || "Failed to seed users" }, { status: 500 });
  }
}
