// Helper สำหรับแสดงผลวันที่ในรูปแบบที่คนทั่วไปอ่านเข้าใจง่าย (ภาษาไทย พ.ศ.)
export function formatThaiDate(dateStr?: string | null): string {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString("th-TH", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatThaiDateRange(startDate?: string | null, endDate?: string | null): string {
  return `${formatThaiDate(startDate)} ถึง ${formatThaiDate(endDate)}`;
}

export function slugify(text?: string | null): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function generateSubdomain(subdomain?: string | null, nameEn?: string | null, nameTh?: string | null): string {
  const cleanSubdomain = slugify(subdomain);
  if (cleanSubdomain) return cleanSubdomain;

  const fromEn = slugify(nameEn);
  if (fromEn) return fromEn;

  const fromTh = slugify(nameTh);
  if (fromTh) return fromTh;

  return "school-" + Math.random().toString(36).substring(2, 8);
}

