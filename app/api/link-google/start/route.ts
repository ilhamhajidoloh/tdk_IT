import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { randomBytes } from "crypto";

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.id) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  const state = randomBytes(16).toString("hex");
  const redirectUri = new URL("/api/link-google/callback", req.url).toString();

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || "",
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email",
    prompt: "select_account",
    state,
  });

  const res = NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
  res.cookies.set("link_google_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return res;
}
