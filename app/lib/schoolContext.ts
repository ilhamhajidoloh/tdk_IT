import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export interface SchoolContext {
  isSuperAdmin: boolean;
  schoolId: string | null;
  userId: string;
  role: string;
}

export async function getSchoolContext(): Promise<SchoolContext | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  const user = session.user as any;

  if (user.role === "super_admin") {
    return {
      isSuperAdmin: true,
      schoolId: null,
      userId: user.id,
      role: user.role,
    };
  }

  return {
    isSuperAdmin: false,
    schoolId: user.school_id || null,
    userId: user.id,
    role: user.role,
  };
}
