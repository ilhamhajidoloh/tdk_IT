import {
  Permission,
  PermissionCategory,
  PermissionAction,
  PermissionDefinition,
  PermissionCategoryDefinition,
  AdminPermissions,
} from "./types";

export const PERMISSION_CATEGORIES: PermissionCategoryDefinition[] = [
  {
    key: "users",
    label: "ผู้ใช้งาน",
    labelEn: "Users",
    description: "จัดการบัญชีผู้ใช้งาน นักเรียน ครู และผู้ดูแลระบบ",
    icon: "Users",
    actions: [
      { permission: "users.view", category: "users", action: "view", label: "ดูรายการผู้ใช้" },
      { permission: "users.create", category: "users", action: "create", label: "เพิ่มผู้ใช้ใหม่" },
      { permission: "users.edit", category: "users", action: "edit", label: "แก้ไขข้อมูลผู้ใช้" },
      { permission: "users.delete", category: "users", action: "delete", label: "ลบผู้ใช้", dangerous: true },
      { permission: "users.manage_roles", category: "users", action: "manage_roles", label: "เปลี่ยน Role ผู้ใช้", dangerous: true },
    ],
  },
  {
    key: "students",
    label: "นักเรียน",
    labelEn: "Students",
    description: "จัดการข้อมูลประวัตินักเรียน การนำเข้า และการเลื่อนชั้น",
    icon: "GraduationCap",
    actions: [
      { permission: "students.view", category: "students", action: "view", label: "ดูรายการนักเรียน" },
      { permission: "students.create", category: "students", action: "create", label: "เพิ่มนักเรียน" },
      { permission: "students.edit", category: "students", action: "edit", label: "แก้ไขข้อมูลนักเรียน" },
      { permission: "students.delete", category: "students", action: "delete", label: "ลบนักเรียน", dangerous: true },
      { permission: "students.import", category: "students", action: "import", label: "นำเข้านักเรียนจาก Excel" },
      { permission: "students.promote", category: "students", action: "promote", label: "เลื่อนชั้นนักเรียน", dangerous: true },
    ],
  },
  {
    key: "classrooms",
    label: "ห้องเรียน",
    labelEn: "Classrooms",
    description: "จัดการโครงสร้างห้องเรียน และการจัดนักเรียนเข้าห้อง",
    icon: "Building2",
    actions: [
      { permission: "classrooms.view", category: "classrooms", action: "view", label: "ดูรายการห้องเรียน" },
      { permission: "classrooms.create", category: "classrooms", action: "create", label: "สร้างห้องเรียนใหม่" },
      { permission: "classrooms.edit", category: "classrooms", action: "edit", label: "แก้ไขห้องเรียน" },
      { permission: "classrooms.delete", category: "classrooms", action: "delete", label: "ลบห้องเรียน", dangerous: true },
      { permission: "classrooms.manage_students", category: "classrooms", action: "manage_students", label: "จัดนักเรียนเข้าห้อง" },
    ],
  },
  {
    key: "subjects",
    label: "วิชาเรียน",
    labelEn: "Subjects",
    description: "จัดการรายวิชา โครงสร้างหลักสูตร และการมอบหมายครูผู้สอน",
    icon: "BookOpen",
    actions: [
      { permission: "subjects.view", category: "subjects", action: "view", label: "ดูรายการวิชา" },
      { permission: "subjects.create", category: "subjects", action: "create", label: "สร้างวิชาใหม่" },
      { permission: "subjects.edit", category: "subjects", action: "edit", label: "แก้ไขวิชา" },
      { permission: "subjects.delete", category: "subjects", action: "delete", label: "ลบวิชา", dangerous: true },
      { permission: "subjects.assign_teachers", category: "subjects", action: "assign_teachers", label: "มอบหมายครูผู้สอน" },
    ],
  },
  {
    key: "schedules",
    label: "ตารางเรียน",
    labelEn: "Schedules",
    description: "จัดการคาบเรียนและตารางสอนประจำห้องเรียน",
    icon: "CalendarDays",
    actions: [
      { permission: "schedules.view", category: "schedules", action: "view", label: "ดูตารางเรียน" },
      { permission: "schedules.create", category: "schedules", action: "create", label: "สร้างตารางเรียน" },
      { permission: "schedules.edit", category: "schedules", action: "edit", label: "แก้ไขตารางเรียน" },
      { permission: "schedules.delete", category: "schedules", action: "delete", label: "ลบตารางเรียน", dangerous: true },
    ],
  },
  {
    key: "attendance",
    label: "เช็คชื่อเข้าเรียน",
    labelEn: "Attendance",
    description: "ตรวจสอบและจัดการข้อมูลการเข้าเรียนและสถิติ",
    icon: "ClipboardCheck",
    actions: [
      { permission: "attendance.view", category: "attendance", action: "view", label: "ดูข้อมูลเช็คชื่อ" },
      { permission: "attendance.edit", category: "attendance", action: "edit", label: "แก้ไขการเช็คชื่อ" },
      { permission: "attendance.reports", category: "attendance", action: "reports", label: "ดูรายงานสถิติการเข้าเรียน" },
    ],
  },
  {
    key: "scores",
    label: "คะแนน & ผลการเรียน",
    labelEn: "Scores & Grades",
    description: "ตรวจสอบคะแนน สถานะส่งคะแนน การประเมิน และพิมพ์รายงานผล",
    icon: "TrendingUp",
    actions: [
      { permission: "scores.view", category: "scores", action: "view", label: "ดูคะแนนและสถานะคะแนน" },
      { permission: "scores.edit", category: "scores", action: "edit", label: "แก้ไขและประเมินผลคะแนน" },
      { permission: "scores.import", category: "scores", action: "import", label: "นำเข้าคะแนนจาก Excel" },
      { permission: "scores.reports", category: "scores", action: "reports", label: "ดูรายงาน อันดับ และส่งออกเกรด" },
    ],
  },
  {
    key: "news",
    label: "ข่าวประชาสัมพันธ์",
    labelEn: "News & Announcements",
    description: "สร้างและจัดการข่าวสารประกาศสำหรับโรงเรียน",
    icon: "Newspaper",
    actions: [
      { permission: "news.view", category: "news", action: "view", label: "ดูข่าวสาร" },
      { permission: "news.create", category: "news", action: "create", label: "สร้างข่าวสารใหม่" },
      { permission: "news.edit", category: "news", action: "edit", label: "แก้ไขข่าวสาร" },
      { permission: "news.delete", category: "news", action: "delete", label: "ลบข่าวสาร", dangerous: true },
    ],
  },
  {
    key: "correspondence",
    label: "หนังสือรับ-ส่ง",
    labelEn: "Correspondence",
    description: "จัดการทะเบียนหนังสือราชการและเอกสารรับ-ส่ง",
    icon: "BookMarked",
    actions: [
      { permission: "correspondence.view", category: "correspondence", action: "view", label: "ดูหนังสือรับ-ส่ง" },
      { permission: "correspondence.create", category: "correspondence", action: "create", label: "สร้างทะเบียนหนังสือ" },
      { permission: "correspondence.edit", category: "correspondence", action: "edit", label: "แก้ไขหนังสือรับ-ส่ง" },
      { permission: "correspondence.delete", category: "correspondence", action: "delete", label: "ลบหนังสือรับ-ส่ง", dangerous: true },
    ],
  },
  {
    key: "duties",
    label: "เวรยามประจำวัน",
    labelEn: "Duties",
    description: "จัดการตารางเวรครูและแม่ครัวประจำวัน",
    icon: "Clock",
    actions: [
      { permission: "duties.view", category: "duties", action: "view", label: "ดูตารางเวรยาม" },
      { permission: "duties.edit", category: "duties", action: "edit", label: "แก้ไขตารางเวรยาม" },
    ],
  },
  {
    key: "analytics",
    label: "สถิติ & รายงานภาพรวม",
    labelEn: "Analytics & Dashboard",
    description: "ดูสถิติภาพรวม แดชบอร์ด และส่งออกข้อมูลวิเคราะห์",
    icon: "BarChart3",
    actions: [
      { permission: "analytics.view", category: "analytics", action: "view", label: "ดูแดชบอร์ดและสถิติ" },
      { permission: "analytics.export", category: "analytics", action: "export", label: "ส่งออกข้อมูลสถิติ" },
    ],
  },
  {
    key: "settings",
    label: "ตั้งค่าระบบ",
    labelEn: "Settings",
    description: "จัดการข้อมูลโรงเรียน ปีการศึกษา และการตั้งค่าพื้นฐาน",
    icon: "Settings",
    actions: [
      { permission: "settings.view", category: "settings", action: "view", label: "ดูการตั้งค่าระบบ" },
      { permission: "settings.edit", category: "settings", action: "edit", label: "แก้ไขการตั้งค่าระบบ", dangerous: true },
      { permission: "settings.academic_year", category: "settings", action: "academic_year", label: "จัดการปีการศึกษา/เปิดปิดเกรด", dangerous: true },
    ],
  },
  {
    key: "co_admins",
    label: "จัดการ Co-admin",
    labelEn: "Co-admin Management",
    description: "แต่งตั้งและกำหนดสิทธิ์ผู้ช่วยผู้ดูแลระบบ (สำหรับ Full Admin เท่านั้น)",
    icon: "ShieldAlert",
    actions: [
      { permission: "co_admins.manage", category: "co_admins", action: "manage", label: "จัดการ Co-admin (Full Admin เท่านั้น)", dangerous: true },
    ],
  },
];

// Helper to look up any permission definition
export const ALL_PERMISSION_DEFINITIONS: PermissionDefinition[] = PERMISSION_CATEGORIES.flatMap((c) => c.actions);

export const VALID_PERMISSION_SET = new Set<Permission>(ALL_PERMISSION_DEFINITIONS.map((d) => d.permission));

/**
 * Validate and sanitize admin_permissions JSON.
 * Rejects unknown categories/actions and forbids assigning `co_admins.manage` to co-admins.
 */
export function sanitizeAndValidatePermissions(input: unknown): { valid: boolean; error?: string; permissions?: AdminPermissions } {
  if (input === null || input === undefined) {
    return { valid: true, permissions: {} };
  }
  if (typeof input !== "object" || Array.isArray(input)) {
    return { valid: false, error: "admin_permissions ต้องเป็น Object" };
  }

  const result: AdminPermissions = {};
  const raw = input as Record<string, unknown>;

  for (const [catKey, actionsObj] of Object.entries(raw)) {
    const categoryDef = PERMISSION_CATEGORIES.find((c) => c.key === catKey);
    if (!categoryDef) {
      return { valid: false, error: `หมวดหมู่สิทธิ์ที่ไม่ถูกต้อง: ${catKey}` };
    }
    if (typeof actionsObj !== "object" || actionsObj === null || Array.isArray(actionsObj)) {
      continue;
    }

    const rawActions = actionsObj as Record<string, unknown>;
    const sanitizedActions: Partial<Record<PermissionAction, boolean>> = {};

    for (const [actKey, val] of Object.entries(rawActions)) {
      if (typeof val !== "boolean") continue;
      const permKey = `${catKey}.${actKey}` as Permission;

      // Never allow co_admins.manage to be assigned
      if (permKey === "co_admins.manage") {
        return { valid: false, error: "ไม่สามารถมอบสิทธิ์จัดการ Co-admin (co_admins.manage) ให้กับ Co-admin ได้" };
      }

      if (!VALID_PERMISSION_SET.has(permKey)) {
        return { valid: false, error: `สิทธิ์ที่ไม่ถูกต้อง: ${permKey}` };
      }

      if (val === true) {
        sanitizedActions[actKey as PermissionAction] = true;
      }
    }

    if (Object.keys(sanitizedActions).length > 0) {
      result[catKey as PermissionCategory] = sanitizedActions;
    }
  }

  return { valid: true, permissions: result };
}

