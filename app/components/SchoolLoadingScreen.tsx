"use client";

import { SchoolLogo, getCurrentSchoolKey, useSchoolBrand } from "./SchoolBrand";

export default function SchoolLoadingScreen({
  title,
  subtitle,
  schoolKey,
}: {
  title: string;
  subtitle?: string;
  schoolKey?: string | null;
}) {
  const currentKey = schoolKey || getCurrentSchoolKey();
  const { school } = useSchoolBrand(currentKey);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-5 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 grid-backdrop opacity-60" />
      <div className="relative z-10 h-20 w-20 overflow-hidden rounded-2xl border border-border bg-card p-2 shadow-lg">
        <SchoolLogo school={school} schoolKey={currentKey} className="h-full w-full rounded-xl" />
      </div>
      <div className="text-center relative z-10">
        <p className="text-foreground font-extrabold text-lg">{school?.name || title}</p>
        {school?.name_en && <p className="text-muted-foreground text-xs mt-1">{school.name_en}</p>}
        {subtitle && <p className="text-muted-foreground text-sm mt-1.5">{subtitle}</p>}
      </div>
      <div className="relative z-10 h-1.5 w-28 overflow-hidden rounded-full bg-border">
        <div className="h-full w-1/2 animate-pulse rounded-full bg-primary" />
      </div>
    </div>
  );
}
