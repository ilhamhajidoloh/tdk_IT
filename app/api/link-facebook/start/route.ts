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
    const redirectUri = new URL("/api/link-facebook/callback", req.url).toString();

    const params = new URLSearchParams({
      client_id: process.env.FACEBOOK_CLIENT_ID || "",
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "email",
      state,
    });

    const res = NextResponse.redirect(`https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`);
    res.cookies.set("link_facebook_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600,
      path: "/",
    });
    return res;
  } catch (error) {
    console.error("Facebook link start error:", error);
    return NextResponse.redirect(new URL("/", req.url));
  }
}
