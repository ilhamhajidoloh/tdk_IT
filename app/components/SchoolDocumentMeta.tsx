"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { updateSchoolDocumentMeta, useSchoolBrand } from "./SchoolBrand";

export default function SchoolDocumentMeta() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isSuperAdminPath = pathname.startsWith("/super-admin");
  const schoolKey = isSuperAdminPath
    ? null
    : pathname === "/"
    ? null
    : searchParams.get("school") ||
      searchParams.get("schoolId") ||
      searchParams.get("school_id") ||
      (typeof window !== "undefined" ? localStorage.getItem("selectedSchool") : null) ||
      "main";
  const { school } = useSchoolBrand(schoolKey);

  useEffect(() => {
    if (isSuperAdminPath) return;
    updateSchoolDocumentMeta(school);
  }, [isSuperAdminPath, school]);

  return null;
}
