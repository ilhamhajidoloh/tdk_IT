import { NextRequest } from "next/server";
import { getToken, decode, JWT } from "next-auth/jwt";

// รองรับสองทาง: มือถือส่ง `Authorization: Bearer <jwt>` มาตรง ๆ, เว็บใช้ httpOnly cookie ตามเดิม
export async function getAuthToken(req: NextRequest): Promise<JWT | null> {
  const secret = process.env.NEXTAUTH_SECRET;
  const authHeader = req.headers.get("authorization");

  if (authHeader?.startsWith("Bearer ")) {
    const raw = authHeader.slice(7).trim();
    if (raw) {
      try {
        const decoded = await decode({ token: raw, secret: secret! });
        if (decoded) return decoded;
      } catch {
        // token ปลอม/หมดอายุ -> ลอง fallback ไปที่ cookie ต่อ
      }
    }
  }

  return getToken({ req, secret });
}
