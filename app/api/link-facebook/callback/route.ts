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
  const savedState = req.cookies.get("link_facebook_state")?.value;

  const fail = (message: string) => {
    const res = NextResponse.redirect(new URL(`${redirectBase}?linkError=${encodeURIComponent(message)}`, req.url));
    res.cookies.delete("link_facebook_state");
    return res;
  };

  if (!code || !state || !savedState || state !== savedState) {
    return fail("คำขอเชื่อมต่อไม่ถูกต้องหรือหมดอายุ กรุณาลองใหม่");
  }

  try {
    const redirectUri = new URL("/api/link-facebook/callback", req.url).toString();

    const tokenRes = await fetch("https://graph.facebook.com/v18.0/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.FACEBOOK_CLIENT_ID || "",
        client_secret: process.env.FACEBOOK_CLIENT_SECRET || "",
        code,
        redirect_uri: redirectUri,
      }),
    });
    const tokenData = await tokenRes.json() as { access_token?: string };
    if (!tokenRes.ok || !tokenData.access_token) {
      return fail("ไม่สามารถยืนยันตัวตนกับ Facebook ได้");
    }

    const userInfoRes = await fetch(`https://graph.facebook.com/me?fields=id,name,email&access_token=${tokenData.access_token}`);
    const userInfo = await userInfoRes.json() as { email?: string };
    const email = userInfo.email?.toLowerCase().trim() || "";

    if (!email) {
      return fail("ไม่พบอีเมลจากบัญชี Facebook");
    }

    // Check if email is already taken by someone else
    const emailCheck = await pool.query("SELECT id FROM users WHERE LOWER(email) = LOWER($1) AND id != $2", [email, token.id]);
    if (emailCheck.rows.length > 0) {
      return fail("อีเมลนี้ถูกใช้งานโดยผู้ใช้คนอื่นแล้ว");
    }

    await pool.query("UPDATE users SET email = $1 WHERE id = $2", [email, token.id]);

    const res = NextResponse.redirect(new URL(`${redirectBase}?linked=${encodeURIComponent(email)}`, req.url));
    res.cookies.delete("link_facebook_state");
    return res;
  } catch (err) {
    console.error("Facebook link callback error:", err);
    return fail("เกิดข้อผิดพลาดในการเชื่อมต่อกับ Facebook");
  }
}
