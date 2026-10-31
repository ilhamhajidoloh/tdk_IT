export interface TeacherColor {
  bg: string;
  text: string;
  border: string;
  name?: string;
}

export const TEACHER_PRESET_COLORS: TeacherColor[] = [
  { bg: "#1d4ed8", text: "#eff6ff", border: "#1e40af", name: "น้ำเงิน" },
  { bg: "#c2410c", text: "#fff7ed", border: "#9a3412", name: "ส้ม" },
  { bg: "#047857", text: "#ecfdf5", border: "#065f46", name: "เขียว" },
  { bg: "#7e22ce", text: "#faf5ff", border: "#6b21a8", name: "ม่วง" },
  { bg: "#a16207", text: "#fefce8", border: "#854d0e", name: "เหลืองทอง" },
  { bg: "#0369a1", text: "#f0f9ff", border: "#075985", name: "ฟ้า" },
  { bg: "#a21caf", text: "#fdf4ff", border: "#86198f", name: "ฟูเชีย" },
  { bg: "#3f6212", text: "#f7fee7", border: "#365314", name: "มะกอก" },
  { bg: "#b91c1c", text: "#fef2f2", border: "#991b1b", name: "แดง" },
  { bg: "#0f766e", text: "#f0fdfa", border: "#115e59", name: "เทอร์ควอยซ์" },
  { bg: "#78350f", text: "#fffbeb", border: "#451a03", name: "น้ำตาล" },
  { bg: "#3730a3", text: "#eef2ff", border: "#312e81", name: "คราม" },
  { bg: "#9f1239", text: "#fff1f2", border: "#881337", name: "กุหลาบเข้ม" },
  { bg: "#334155", text: "#f8fafc", border: "#1e293b", name: "เทาเข้ม" },
  { bg: "#be123c", text: "#fff1f2", border: "#9f1239", name: "แดงเชอร์รี่" },
  { bg: "#155e75", text: "#ecfeff", border: "#164e63", name: "น้ำทะเลเข้ม" },
];

export function resolveTeacherColor(
  rawColor?: string | null,
  fallbackIndex: number = 0
): TeacherColor {
  if (rawColor && typeof rawColor === "string") {
    const trimmed = rawColor.trim();
    const preset = TEACHER_PRESET_COLORS.find(
      (c) => c.bg.toLowerCase() === trimmed.toLowerCase()
    );
    if (preset) return preset;

    if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed)) {
      let hex = trimmed.replace("#", "");
      if (hex.length === 3) {
        hex = hex.split("").map((c) => c + c).join("");
      }
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      const yiq = (r * 299 + g * 587 + b * 114) / 1000;
      const text = yiq >= 140 ? "#0f172a" : "#ffffff";
      const dr = Math.max(0, Math.floor(r * 0.8)).toString(16).padStart(2, "0");
      const dg = Math.max(0, Math.floor(g * 0.8)).toString(16).padStart(2, "0");
      const db = Math.max(0, Math.floor(b * 0.8)).toString(16).padStart(2, "0");
      return { bg: trimmed, text, border: `#${dr}${dg}${db}` };
    }

    if (trimmed.startsWith("hsl") || trimmed.startsWith("rgb")) {
      return { bg: trimmed, text: "#ffffff", border: trimmed };
    }
  }

  if (TEACHER_PRESET_COLORS[fallbackIndex]) {
    return TEACHER_PRESET_COLORS[fallbackIndex];
  }
  const hue = Math.round(((fallbackIndex - TEACHER_PRESET_COLORS.length) * 137.508 + 15) % 360);
  return { bg: `hsl(${hue} 70% 32%)`, text: "#ffffff", border: `hsl(${hue} 72% 23%)` };
}

