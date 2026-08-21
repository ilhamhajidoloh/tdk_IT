export type LanguageCode =
  | "th"
  | "thai"
  | "ms-rumi"
  | "rumi"
  | "ms-jawi"
  | "jawi"
  | "arabic";

export interface ClassroomNameSource {
  name?: string | null;
  name_thai?: string | null;
  name_rumi?: string | null;
  name_jawi?: string | null;
  classroom_name?: string | null;
  classroom_name_thai?: string | null;
  classroom_name_rumi?: string | null;
  classroom_name_jawi?: string | null;
}

/**
 * ดึงชื่อชั้นเรียนตามภาษาที่ต้องการ
 * @param classroom ออบเจกต์ชั้นเรียน
 * @param lang รหัสภาษา ("th" | "thai" | "ms-rumi" | "rumi" | "ms-jawi" | "jawi" | "arabic")
 * @returns ชื่อชั้นเรียนตามภาษาที่ระบุ หากไม่มีจะ fallback ไปชื่อหลัก (name)
 */
export function getClassroomName(
  classroom: ClassroomNameSource | null | undefined,
  lang: LanguageCode = "th"
): string {
  if (!classroom) return "";

  const defaultName = classroom.classroom_name?.trim() || classroom.name?.trim() || "";
  const nameThai = classroom.classroom_name_thai?.trim() || classroom.name_thai?.trim();
  const nameRumi = classroom.classroom_name_rumi?.trim() || classroom.name_rumi?.trim();
  const nameJawi = classroom.classroom_name_jawi?.trim() || classroom.name_jawi?.trim();

  if (lang === "th" || lang === "thai") {
    return nameThai || defaultName;
  }
  if (lang === "ms-rumi" || lang === "rumi") {
    return nameRumi || defaultName;
  }
  if (lang === "ms-jawi" || lang === "jawi" || lang === "arabic") {
    return nameJawi || defaultName;
  }

  return defaultName;
}

/**
 * จัดรูปแบบชื่อชั้นเรียนสำหรับแสดงผลใน Select หรือ Badge พร้อมระบุชื่อภาษาอื่นถ้ามี
 */
export function formatClassroomOption(
  classroom: ClassroomNameSource | null | undefined,
  lang?: LanguageCode
): string {
  if (!classroom) return "";
  const primaryName = lang ? getClassroomName(classroom, lang) : (classroom.classroom_name || classroom.name || "");
  const defaultName = classroom.classroom_name || classroom.name || "";

  // ถ้าเลือกภาษาแล้วได้ชื่อที่ไม่เหมือนชื่อหลัก ให้แสดงควบคู่ เช่น "มัธยมศึกษาปีที่ 1 (M.1/1)"
  if (primaryName && defaultName && primaryName !== defaultName) {
    return `${primaryName} (${defaultName})`;
  }
  return primaryName || defaultName;
}
