import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import pool from "@/app/lib/db";

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.id) {
      return NextResponse.json({ error: "ไม่ได้รับอนุญาต" }, { status: 401 });
    }

    await pool.query("UPDATE users SET email = NULL WHERE id = $1", [token.id]);

    return NextResponse.json({
      success: true,
      message: "ยกเลิกการเชื่อมต่อบัญชีโซเชียลเรียบร้อยแล้ว",
    });
  } catch (error: any) {
    console.error("Unlink error:", error);
    return NextResponse.json(
      { error: error.message || "เกิดข้อผิดพลาดในการยกเลิกการเชื่อมต่อ" },
      { status: 500 }
    );
  }
}
