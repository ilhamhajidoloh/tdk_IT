import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function verifyUser(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.id) return null;
  return {
    id: token.id as string,
    role: token.role as string,
    name: token.name as string,
    student_id: (token.student_id as string | undefined) ?? null,
    homeroom_classroom_id: (token.homeroom_classroom_id as string | undefined) ?? null,
  };
}
