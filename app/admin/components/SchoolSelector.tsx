"use client";

import { useEffect, useState } from "react";
import { Building2 } from "lucide-react";

interface School {
  id: string;
  name: string;
  subdomain: string;
  is_active?: boolean;
}

interface SchoolSelectorProps {
  selectedSchoolId: string | null;
  onSchoolChange: (schoolId: string) => void;
}

export default function SchoolSelector({ selectedSchoolId, onSchoolChange }: SchoolSelectorProps) {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/super-admin/schools")
      .then((res) => (res.ok ? res.json() : fetch("/api/public/schools").then((r) => r.json())))
      .then((data) => {
        if (Array.isArray(data)) {
          setSchools(data);
          // If no school selected yet, pick first school
          if (!selectedSchoolId && data.length > 0) {
            onSchoolChange(data[0].id);
          }
        }
      })
      .catch((err) => console.error("Error loading schools for selector:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-xs text-muted-foreground animate-pulse">กำลังโหลดรายการโรงเรียน...</div>;
  }

  return (
    <div className="flex items-center gap-2 bg-card border border-border px-3 py-1.5 rounded-xl shadow-sm">
      <Building2 className="w-4 h-4 text-primary shrink-0" />
      <span className="text-xs font-bold text-muted-foreground whitespace-nowrap">โรงเรียน:</span>
      <select
        value={selectedSchoolId || ""}
        onChange={(e) => onSchoolChange(e.target.value)}
        className="bg-transparent text-xs font-extrabold text-foreground focus:outline-none cursor-pointer pr-2"
      >
        {schools.map((s) => (
          <option key={s.id} value={s.id} className="bg-card text-foreground">
            {s.name} ({s.subdomain})
          </option>
        ))}
      </select>
    </div>
  );
}
