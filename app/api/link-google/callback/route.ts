import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import pool from "@/app/lib/db";

function dashboardPath(role?: string) {
  if (role === "admin") return "/admin";
  if (role === "teacher") return "/teacher";
  return "/student";
}

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.id) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  const redirectBase = dashboardPath(token.role as string | undefined);
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const savedState = req.cookies.get("link_google_state")?.value;

  const fail = (message: string) => {
    const res = NextResponse.redirect(new URL(`${redirectBase}?linkError=${encodeURIComponent(message)}`, req.url));
    res.cookies.delete("link_google_state");
    return res;
  };

  if (!code || !state || !savedState || state !== savedState) {
    return fail("คำขอเชื่อมต่อไม่ถูกต้องหรือหมดอายุ กรุณาลองใหม่");
  }

  try {
    const redirectUri = new URL("/api/link-google/callback", req.url).toString();

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID || "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }),
    });
    const tokenData = await tokenRes.json() as { access_token?: string };
    if (!tokenRes.ok || !tokenData.access_token) {
      return fail("ไม่สามารถยืนยันตัวตนกับ Google ได้");
    }

    const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const userInfo = await userInfoRes.json() as { email?: string };
    const email = userInfo.email?.toLowerCase().trim();
    if (!email) {
      return fail("ไม่พบอีเมลจากบัญชี Google");
    }

    await pool.query("UPDATE users SET email = $1 WHERE id = $2", [email, token.id]);

    const res = NextResponse.redirect(new URL(`${redirectBase}?linked=${encodeURIComponent(email)}`, req.url));
    res.cookies.delete("link_google_state");
    return res;
  } catch (err) {
    if (typeof err === "object" && err !== null && "code" in err && err.code === "23505") {
      return fail("อีเมลนี้ถูกใช้งานโดยผู้ใช้คนอื่นแล้ว");
    }
    return fail("เกิดข้อผิดพลาดในการเชื่อมต่อกับ Google");
  }
}
