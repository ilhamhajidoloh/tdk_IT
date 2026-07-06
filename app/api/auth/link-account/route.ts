import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import bcrypt from "bcrypt";
import pool from "@/app/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { email, provider, sig, username, role, password } = await req.json();

    if (!email || !provider || !sig || !username || !role || !password) {
      return NextResponse.json(
        { error: "ข้อมูลไม่ครบถ้วนสำหรับการเชื่อมโยงบัญชี" },
        { status: 400 }
      );
    }

    // 1. Verify HMAC Signature
    const secret = process.env.NEXTAUTH_SECRET || "fallback-secret";
    const data = `${email}:${provider}`;
    const expectedSignature = createHmac("sha256", secret).update(data).digest("hex");

    if (sig !== expectedSignature) {
      return NextResponse.json(
        { error: "คำขอผูกบัญชีไม่ถูกต้องหรือลายเซ็นหมดอายุ" },
        { status: 400 }
      );
    }

    // 2. Check if the email is already in use by another user
    const emailCheck = await pool.query(
      "SELECT id FROM users WHERE LOWER(email) = LOWER($1)",
      [email]
    );
    if (emailCheck.rows.length > 0) {
      return NextResponse.json(
        { error: "อีเมลนี้ถูกใช้งานโดยผู้ใช้อื่นในระบบแล้ว" },
        { status: 400 }
      );
    }

    // 3. Find the user by username/student_id and role
    const dbRole = role === "staff" ? "admin" : role;
    const result = await pool.query(
      "SELECT id, password, email FROM users WHERE (username = $1 OR student_id = $1) AND role = $2",
      [username, dbRole]
    );

    const user = result.rows[0];
    if (!user) {
      return NextResponse.json(
        { error: "ไม่พบชื่อผู้ใช้หรือรหัสประจำตัวนี้ในระบบสำหรับบทบาทที่เลือก" },
        { status: 400 }
      );
    }

    // 4. Verify password
    if (!user.password) {
      return NextResponse.json(
        { error: "บัญชีนี้ยังไม่ได้กำหนดรหัสผ่าน กรุณาติดต่อแอดมิน" },
        { status: 400 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "รหัสผ่านไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    // 5. Update user's email
    await pool.query("UPDATE users SET email = $1 WHERE id = $2", [email, user.id]);

    return NextResponse.json({
      success: true,
      message: "เชื่อมต่ออีเมลสำเร็จแล้ว",
    });
  } catch (error: any) {
    console.error("Link account error:", error);
    return NextResponse.json(
      { error: error.message || "เกิดข้อผิดพลาดในการเชื่อมโยงบัญชี" },
      { status: 500 }
    );
  }
}
