// หัวข้อ "การอ่าน คิดวิเคราะห์ และเขียน" เป็นหัวข้อตายตัว ไม่ต้องให้แอดมินจัดการ
export const RWT_TOPICS = [
  { key: "reading", th: "การอ่าน", rumi: "Membaca", jawi: "ممباچا" },
  { key: "writing", th: "การเขียนสื่อความ", rumi: "Menulis untuk Menyampaikan Maksud", jawi: "منوليس اونتوق مڽمڤايكن مقصود" },
  { key: "thinking", th: "การคิดวิเคราะห์", rumi: "Pemikiran Analitikal", jawi: "ڤميکيرن اناليتيکل" },
] as const;

export type RwtTopicKey = (typeof RWT_TOPICS)[number]["key"];

export type EvaluationLang = "th" | "ms-rumi" | "ms-jawi";

// ระดับผลการประเมิน เรียงจากมากไปน้อย — ใช้ MAX(rating) เพื่อเลือกผลที่ดีที่สุดจากทุกวิชา
export const RATING_LEVELS = [
  { value: 3, th: "ดีเยี่ยม", rumi: "Cemerlang", jawi: "چمرلڠ", color: "emerald" },
  { value: 2, th: "ดี", rumi: "Baik", jawi: "باءيق", color: "sky" },
  { value: 1, th: "ผ่าน", rumi: "Lulus", jawi: "لولوس", color: "amber" },
  { value: 0, th: "ไม่ผ่าน", rumi: "Gagal", jawi: "ڬاڬل", color: "rose" },
] as const;

export type RatingValue = (typeof RATING_LEVELS)[number]["value"];

export function getRatingLevel(value: number | null | undefined) {
  return RATING_LEVELS.find((r) => r.value === value) ?? null;
}

export function getRatingLabel(value: number | null | undefined, lang: EvaluationLang): string {
  const level = getRatingLevel(value);
  if (!level) return "—";
  if (lang === "ms-rumi") return level.rumi;
  if (lang === "ms-jawi") return level.jawi;
  return level.th;
}

export function getRwtTopicLabel(key: string, lang: EvaluationLang): string {
  const topic = RWT_TOPICS.find((t) => t.key === key);
  if (!topic) return key;
  if (lang === "ms-rumi") return topic.rumi;
  if (lang === "ms-jawi") return topic.jawi;
  return topic.th;
}

export function getTopicNameLabel(
  topic: { name_th: string; name_rumi?: string | null; name_jawi?: string | null },
  lang: EvaluationLang
): string {
  if (lang === "ms-rumi") return topic.name_rumi?.trim() || topic.name_th;
  if (lang === "ms-jawi") return topic.name_jawi?.trim() || topic.name_th;
  return topic.name_th;
}

export const RATING_BADGE_CLASSES: Record<number, string> = {
  3: "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30",
  2: "bg-sky-100 dark:bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-500/30",
  1: "bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30",
  0: "bg-rose-100 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/30",
};

// ระบบเปิดให้ประเมิน/ดูผลการประเมินเฉพาะภาคเรียนที่ 2 ของปีการศึกษานั้นๆ
export function isEvaluationTermOpen(term?: string | number | null): boolean {
  return String(term) === "2";
}
