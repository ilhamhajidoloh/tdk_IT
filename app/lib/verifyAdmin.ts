import { NextRequest } from "next/server";
import { getAuthToken } from "@/app/lib/getAuthToken";

export async function verifyAdmin(req: NextRequest): Promise<boolean> {
  const token = await getAuthToken(req);
  if (token && (token.role === "admin" || token.role === "super_admin")) {
    return true;
  }
  return false;
}
