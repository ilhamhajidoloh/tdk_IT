import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { randomBytes } from "crypto";

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.id) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    const state = randomBytes(16).toString("hex");
    const redirectUri = new URL("/api/link-line/callback", req.url).toString();

    const params = new URLSearchParams({
      client_id: process.env.LINE_CLIENT_ID || "",
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "profile openid email",
      state,
    });

    const res = NextResponse.redirect(`https://access.line.me/oauth2/v2.1/authorize?${params.toString()}`);
    res.cookies.set("link_line_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600,
      path: "/",
    });
    return res;
  } catch (error) {
    console.error("LINE link start error:", error);
    return NextResponse.redirect(new URL("/", req.url));
  }
}
