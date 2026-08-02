import { NextRequest } from "next/server";
import { getAuthToken } from "@/app/lib/getAuthToken";

export async function verifyUser(req: NextRequest) {
  const token = await getAuthToken(req);
  if (!token?.id) return null;
  return {
    id: token.id as string,
    role: token.role as string,
    name: token.name as string,
    student_id: (token.student_id as string | undefined) ?? null,
    homeroom_classroom_id: (token.homeroom_classroom_id as string | undefined) ?? null,
    is_clerical: !!token.is_clerical,
  };
}
