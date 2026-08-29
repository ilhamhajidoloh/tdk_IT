export type PermissionCategory =
  | "users"
  | "students"
  | "classrooms"
  | "subjects"
  | "schedules"
  | "attendance"
  | "scores"
  | "news"
  | "correspondence"
  | "duties"
  | "analytics"
  | "settings"
  | "co_admins";

export type PermissionAction =
  | "view"
  | "create"
  | "edit"
  | "delete"
  | "manage_roles"
  | "import"
  | "export"
  | "promote"
  | "manage_students"
  | "assign_teachers"
  | "reorder"
  | "translations"
  | "reports"
  | "rankings"
  | "evaluations"
  | "academic_year"
  | "manage";

export type Permission =
  // Users
  | "users.view"
  | "users.create"
  | "users.edit"
  | "users.delete"
  | "users.import"
  | "users.manage_roles"
  // Students
  | "students.view"
  | "students.create"
  | "students.edit"
  | "students.delete"
  | "students.import"
  | "students.export"
  | "students.promote"
  // Classrooms
  | "classrooms.view"
  | "classrooms.create"
  | "classrooms.edit"
  | "classrooms.delete"
  | "classrooms.import"
  | "classrooms.manage_students"
  // Subjects
  | "subjects.view"
  | "subjects.create"
  | "subjects.edit"
  | "subjects.delete"
  | "subjects.assign_teachers"
  | "subjects.reorder"
  | "subjects.translations"
  // Schedules
  | "schedules.view"
  | "schedules.create"
  | "schedules.edit"
  | "schedules.delete"
  | "schedules.export"
  // Attendance
  | "attendance.view"
  | "attendance.edit"
  | "attendance.reports"
  // Scores
  | "scores.view"
  | "scores.edit"
  | "scores.import"
  | "scores.reports"
  | "scores.rankings"
  | "scores.evaluations"
  // News
  | "news.view"
  | "news.create"
  | "news.edit"
  | "news.delete"
  // Correspondence
  | "correspondence.view"
  | "correspondence.create"
  | "correspondence.edit"
  | "correspondence.delete"
  // Duties
  | "duties.view"
  | "duties.create"
  | "duties.edit"
  | "duties.delete"
  | "duties.manage"
  // Analytics
  | "analytics.view"
  | "analytics.export"
  // Settings
  | "settings.view"
  | "settings.edit"
  | "settings.academic_year"
  | "settings.translations"
  // Co-admins (Full Admin only)
  | "co_admins.manage";

export type AdminPermissions = Partial<Record<PermissionCategory, Partial<Record<PermissionAction, boolean>>>>;

export interface PermissionDefinition {
  permission: Permission;
  category: PermissionCategory;
  action: PermissionAction;
  label: string;
  description?: string;
  dangerous?: boolean;
}

export interface PermissionCategoryDefinition {
  key: PermissionCategory;
  label: string;
  labelEn: string;
  description: string;
  icon: string;
  actions: PermissionDefinition[];
}

export interface CoAdminUser {
  id: string;
  username: string;
  role: string;
  school_id?: string;
  email?: string | null;
  is_clerical?: boolean;
  is_co_admin: boolean;
  admin_permissions: AdminPermissions | null;
  created_at?: string;
  subjects?: string[];
  homeroom_classroom_id?: string;
}

export interface PermissionPreset {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  icon: string;
  permissions: AdminPermissions;
}

