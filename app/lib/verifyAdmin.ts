import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function verifyAdmin(req: NextRequest): Promise<boolean> {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (token && token.role === "admin") {
    return true;
  }
  return false;
}
