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
