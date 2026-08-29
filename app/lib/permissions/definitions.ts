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
    label: "ผู้ใช้งาน (Users)",
    labelEn: "Users",
    description: "จัดการบัญชีผู้ใช้งาน นักเรียน ครู และผู้ดูแลระบบ",
    icon: "Users",
    actions: [
      { permission: "users.view", category: "users", action: "view", label: "ดูรายการผู้ใช้" },
      { permission: "users.create", category: "users", action: "create", label: "เพิ่มผู้ใช้ใหม่" },
      { permission: "users.edit", category: "users", action: "edit", label: "แก้ไขข้อมูลผู้ใช้ / รหัสผ่าน" },
      { permission: "users.delete", category: "users", action: "delete", label: "ลบผู้ใช้", dangerous: true },
      { permission: "users.import", category: "users", action: "import", label: "นำเข้าผู้ใช้จาก Excel / CSV" },
      { permission: "users.manage_roles", category: "users", action: "manage_roles", label: "เปลี่ยน Role / สถานะธุรการ", dangerous: true },
    ],
  },
  {
    key: "students",
    label: "นักเรียน (Students)",
    labelEn: "Students",
    description: "จัดการข้อมูลประวัตินักเรียน ทะเบียน การนำเข้า และการเลื่อนชั้น",
    icon: "GraduationCap",
    actions: [
      { permission: "students.view", category: "students", action: "view", label: "ดูรายการและประวัตินักเรียน" },
      { permission: "students.create", category: "students", action: "create", label: "เพิ่มนักเรียนใหม่" },
      { permission: "students.edit", category: "students", action: "edit", label: "แก้ไขข้อมูลนักเรียน / เลขที่ / ย้ายห้อง" },
      { permission: "students.delete", category: "students", action: "delete", label: "ลบนักเรียน", dangerous: true },
      { permission: "students.import", category: "students", action: "import", label: "นำเข้านักเรียนจาก Excel" },
      { permission: "students.export", category: "students", action: "export", label: "ส่งออกรายชื่อนักเรียนเป็น Excel / พิมพ์" },
      { permission: "students.promote", category: "students", action: "promote", label: "เลื่อนชั้นนักเรียน / ปรับจบการศึกษา", dangerous: true },
    ],
  },
  {
    key: "classrooms",
    label: "ห้องเรียน (Classrooms)",
    labelEn: "Classrooms",
    description: "จัดการโครงสร้างห้องเรียน คัดลอกชั้นเรียน และจัดนักเรียนเข้าห้อง",
    icon: "Building2",
    actions: [
      { permission: "classrooms.view", category: "classrooms", action: "view", label: "ดูรายการห้องเรียน" },
      { permission: "classrooms.create", category: "classrooms", action: "create", label: "สร้างห้องเรียนใหม่ / คัดลอกห้องเรียน" },
      { permission: "classrooms.edit", category: "classrooms", action: "edit", label: "แก้ไขข้อมูลห้องเรียน (ไทย/รูมี/ยาวี)" },
      { permission: "classrooms.delete", category: "classrooms", action: "delete", label: "ลบห้องเรียน", dangerous: true },
      { permission: "classrooms.import", category: "classrooms", action: "import", label: "นำเข้าห้องเรียนจาก Excel" },
      { permission: "classrooms.manage_students", category: "classrooms", action: "manage_students", label: "จัด/ย้ายนักเรียนเข้าห้องเรียน" },
    ],
  },
  {
    key: "subjects",
    label: "วิชาเรียน (Subjects)",
    labelEn: "Subjects",
    description: "จัดการรายวิชา มอบหมายครูผู้สอน เรียงลำดับ และคำแปลรายวิชา",
    icon: "BookOpen",
    actions: [
      { permission: "subjects.view", category: "subjects", action: "view", label: "ดูรายการวิชาเรียน" },
      { permission: "subjects.create", category: "subjects", action: "create", label: "สร้างวิชาใหม่ / คัดลอกรายวิชา" },
      { permission: "subjects.edit", category: "subjects", action: "edit", label: "แก้ไขวิชา / โครงสร้างคะแนนเก็บ-สอบ" },
      { permission: "subjects.delete", category: "subjects", action: "delete", label: "ลบวิชาเรียน", dangerous: true },
      { permission: "subjects.assign_teachers", category: "subjects", action: "assign_teachers", label: "มอบหมายครูผู้สอนประจำวิชา" },
      { permission: "subjects.reorder", category: "subjects", action: "reorder", label: "จัดเรียงลำดับรายวิชา" },
      { permission: "subjects.translations", category: "subjects", action: "translations", label: "จัดการคำแปลภาษารายวิชา (รูมี/ยาวี)" },
    ],
  },
  {
    key: "schedules",
    label: "ตารางเรียน (Schedules)",
    labelEn: "Schedules",
    description: "จัดการคาบเรียน กำหนดเวลาเรียน และจัดตารางสอน",
    icon: "CalendarDays",
    actions: [
      { permission: "schedules.view", category: "schedules", action: "view", label: "ดูตารางเรียนและตารางสอน" },
      { permission: "schedules.create", category: "schedules", action: "create", label: "สร้าง/เพิ่มคาบเรียนใหม่" },
      { permission: "schedules.edit", category: "schedules", action: "edit", label: "แก้ไขเวลาคาบเรียน / กำหนดตารางสอน" },
      { permission: "schedules.delete", category: "schedules", action: "delete", label: "ลบคาบเรียน / ลบตารางสอน", dangerous: true },
      { permission: "schedules.export", category: "schedules", action: "export", label: "พิมพ์ / ส่งออกตารางเรียน" },
    ],
  },
  {
    key: "scores",
    label: "คะแนน & ผลการเรียน (Scores & Grades)",
    labelEn: "Scores & Grades",
    description: "ตรวจสอบคะแนน แก้ไขเกรด ดูอันดับ ประเมินคุณลักษณะ และพิมพ์รายงาน",
    icon: "TrendingUp",
    actions: [
      { permission: "scores.view", category: "scores", action: "view", label: "ดูคะแนนและสถานะการส่งเกรด" },
      { permission: "scores.edit", category: "scores", action: "edit", label: "บันทึก / แก้ไขคะแนนสอบและเกรด" },
      { permission: "scores.import", category: "scores", action: "import", label: "นำเข้าคะแนนจาก Excel" },
      { permission: "scores.reports", category: "scores", action: "reports", label: "ดูรายงานคะแนน / พิมพ์ใบ ปพ. / ส่งออกเกรด" },
      { permission: "scores.rankings", category: "scores", action: "rankings", label: "ดูอันดับผลการเรียน (Rankings) & ผลสัมฤทธิ์" },
      { permission: "scores.evaluations", category: "scores", action: "evaluations", label: "ประเมินคุณลักษณะ & อ่านคิดวิเคราะห์" },
    ],
  },
  {
    key: "attendance",
    label: "เช็คชื่อเข้าเรียน (Attendance)",
    labelEn: "Attendance",
    description: "ตรวจสอบและจัดการข้อมูลการเช็คชื่อเข้าเรียนและสถิติ",
    icon: "ClipboardCheck",
    actions: [
      { permission: "attendance.view", category: "attendance", action: "view", label: "ดูข้อมูลการเช็คชื่อ" },
      { permission: "attendance.edit", category: "attendance", action: "edit", label: "บันทึก/แก้ไขการเช็คชื่อเข้าเรียน" },
      { permission: "attendance.reports", category: "attendance", action: "reports", label: "ดูรายงานสถิติการเข้าเรียน" },
    ],
  },
  {
    key: "news",
    label: "ข่าวประชาสัมพันธ์ (News)",
    labelEn: "News & Announcements",
    description: "สร้าง แก้ไข และจัดการประกาศข่าวสารสำหรับโรงเรียน",
    icon: "Newspaper",
    actions: [
      { permission: "news.view", category: "news", action: "view", label: "ดูข่าวสารประชาสัมพันธ์" },
      { permission: "news.create", category: "news", action: "create", label: "สร้างและโพสต์ข่าวใหม่" },
      { permission: "news.edit", category: "news", action: "edit", label: "แก้ไขข่าวสาร / สลับเผยแพร่" },
      { permission: "news.delete", category: "news", action: "delete", label: "ลบข่าวสารประชาสัมพันธ์", dangerous: true },
    ],
  },
  {
    key: "correspondence",
    label: "หนังสือรับ-ส่ง (Correspondence)",
    labelEn: "Correspondence",
    description: "จัดการทะเบียนหนังสือราชการและเอกสารรับ-ส่งสารบรรณ",
    icon: "BookMarked",
    actions: [
      { permission: "correspondence.view", category: "correspondence", action: "view", label: "ดูทะเบียนหนังสือรับ-ส่ง" },
      { permission: "correspondence.create", category: "correspondence", action: "create", label: "สร้างทะเบียนหนังสือ / ออกเลขหนังสือ" },
      { permission: "correspondence.edit", category: "correspondence", action: "edit", label: "แก้ไขรายละเอียดหนังสือ / แนบไฟล์" },
      { permission: "correspondence.delete", category: "correspondence", action: "delete", label: "ลบทะเบียนหนังสือรับ-ส่ง", dangerous: true },
    ],
  },
  {
    key: "duties",
    label: "เวรยาม & วันหยุด (Duties)",
    labelEn: "Duties & Holidays",
    description: "จัดการตารางเวรครู เวรแม่ครัว และวันหยุดพิเศษ",
    icon: "Clock",
    actions: [
      { permission: "duties.view", category: "duties", action: "view", label: "ดูตารางเวรและวันหยุดพิเศษ" },
      { permission: "duties.create", category: "duties", action: "create", label: "เพิ่มกลุ่มเวรครู / แม่ครัว" },
      { permission: "duties.edit", category: "duties", action: "edit", label: "แก้ไขกลุ่มเวร / จัดการวันหยุดพิเศษ" },
      { permission: "duties.delete", category: "duties", action: "delete", label: "ลบกลุ่มเวร / วันหยุดพิเศษ", dangerous: true },
      { permission: "duties.manage", category: "duties", action: "manage", label: "ตั้งค่าจุดเริ่มต้นการหมุนเวร (Anchor Date)", dangerous: true },
    ],
  },
  {
    key: "analytics",
    label: "สถิติ & แดชบอร์ด (Analytics)",
    labelEn: "Analytics & Dashboard",
    description: "ดูสถิติภาพรวม แดชบอร์ด และส่งออกข้อมูลวิเคราะห์",
    icon: "BarChart3",
    actions: [
      { permission: "analytics.view", category: "analytics", action: "view", label: "ดูแดชบอร์ดและสถิติภาพรวม" },
      { permission: "analytics.export", category: "analytics", action: "export", label: "ส่งออกข้อมูลสถิติภาพรวม" },
    ],
  },
  {
    key: "settings",
    label: "ตั้งค่าระบบ (Settings)",
    labelEn: "Settings",
    description: "จัดการข้อมูลโรงเรียน ปีการศึกษา และพจนานุกรมคำแปลภาษา",
    icon: "Settings",
    actions: [
      { permission: "settings.view", category: "settings", action: "view", label: "ดูการตั้งค่าระบบและข้อมูลโรงเรียน" },
      { permission: "settings.edit", category: "settings", action: "edit", label: "แก้ไขข้อมูลทั่วไปโรงเรียน", dangerous: true },
      { permission: "settings.academic_year", category: "settings", action: "academic_year", label: "จัดการปีการศึกษา/เปิดปิดเกรด", dangerous: true },
      { permission: "settings.translations", category: "settings", action: "translations", label: "จัดการคำแปลภาษาในระบบ (Dictionary)" },
    ],
  },
  {
    key: "co_admins",
    label: "จัดการ Co-admin (เฉพาะ Full Admin)",
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

