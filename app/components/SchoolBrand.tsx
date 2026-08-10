"use client";

import { useEffect, useMemo, useState } from "react";
import { School as SchoolIcon } from "lucide-react";

export const DEFAULT_SCHOOL_LOGO = "/tdk-it-logo.svg";

export interface SchoolInfo {
  id?: string;
  name?: string | null;
  name_en?: string | null;
  subdomain?: string | null;
  logo_url?: string | null;
  logo_drive_file_id?: string | null;
  enabled_modules?: object | null;
}

export function getSchoolLogoUrl(
  logoDriveFileId?: string | null,
  logoUrl?: string | null
): string {
  // Priority: Drive File ID > Legacy URL > Default
  if (logoDriveFileId?.trim()) {
    return `/api/public/schools/logo/${logoDriveFileId}`;
  }
  if (logoUrl?.trim()) {
    return logoUrl;
  }
  return DEFAULT_SCHOOL_LOGO;
}

export function updateSchoolDocumentMeta(school?: SchoolInfo | null) {
  if (typeof document === "undefined") return;

  const logo = getSchoolLogoUrl(school?.logo_drive_file_id, school?.logo_url);
  const name = school?.name?.trim() || "TDK IT";
  const nameEn = school?.name_en?.trim();

  document.title = nameEn ? `${name} | ${nameEn}` : name;

  const icons = Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel~="icon"]'));
  if (icons.length === 0) {
    const icon = document.createElement("link");
    icon.rel = "icon";
    document.head.appendChild(icon);
    icons.push(icon);
  }
  icons.forEach((icon) => {
    icon.href = logo;
  });
}

interface SchoolLogoProps {
  school?: SchoolInfo | null;
  schoolKey?: string | null;
  className?: string;
  alt?: string;
}

export function SchoolLogo({ school, schoolKey, className = "h-10 w-10", alt }: SchoolLogoProps) {
  const [src, setSrc] = useState(DEFAULT_SCHOOL_LOGO);
  const logoUrl = getSchoolLogoUrl(school?.logo_drive_file_id, school?.logo_url);

  useEffect(() => {
    setSrc(logoUrl);
  }, [logoUrl, schoolKey]);

  return (
    <img
      src={src}
      alt={alt || school?.name || "โลโก้โรงเรียน"}
      className={`object-cover ${className}`}
      onError={() => {
        if (src !== DEFAULT_SCHOOL_LOGO) setSrc(DEFAULT_SCHOOL_LOGO);
      }}
    />
  );
}

export function SchoolLogoFallback({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center bg-primary/10 text-primary ${className}`}>
      <SchoolIcon className="h-1/2 w-1/2" />
    </div>
  );
}

export function useSchoolBrand(schoolKey?: string | null) {
  const [school, setSchool] = useState<SchoolInfo | null>(null);
  const [loading, setLoading] = useState(Boolean(schoolKey));
  const key = useMemo(() => schoolKey?.trim() || "", [schoolKey]);

  useEffect(() => {
    if (!key) {
      setSchool(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    fetch(`/api/public/schools/${encodeURIComponent(key)}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!cancelled) {
          setSchool(data);
          updateSchoolDocumentMeta(data);
        }
      })
      .catch(() => {
        if (!cancelled) setSchool(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [key]);

  return { school, loading };
}

export function getCurrentSchoolKey() {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  return params.get("school") || params.get("schoolId") || localStorage.getItem("selectedSchool") || "main";
}
