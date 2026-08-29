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
  | "promote"
  | "manage_students"
  | "assign_teachers"
  | "reports"
  | "export"
  | "academic_year"
  | "manage";

export type Permission =
  | "users.view"
  | "users.create"
  | "users.edit"
  | "users.delete"
  | "users.manage_roles"
  | "students.view"
  | "students.create"
  | "students.edit"
  | "students.delete"
  | "students.import"
  | "students.promote"
  | "classrooms.view"
  | "classrooms.create"
  | "classrooms.edit"
  | "classrooms.delete"
  | "classrooms.manage_students"
  | "subjects.view"
  | "subjects.create"
  | "subjects.edit"
  | "subjects.delete"
  | "subjects.assign_teachers"
  | "schedules.view"
  | "schedules.create"
  | "schedules.edit"
  | "schedules.delete"
  | "attendance.view"
  | "attendance.edit"
  | "attendance.reports"
  | "scores.view"
  | "scores.edit"
  | "scores.import"
  | "scores.reports"
  | "news.view"
  | "news.create"
  | "news.edit"
  | "news.delete"
  | "correspondence.view"
  | "correspondence.create"
  | "correspondence.edit"
  | "correspondence.delete"
  | "duties.view"
  | "duties.edit"
  | "analytics.view"
  | "analytics.export"
  | "settings.view"
  | "settings.edit"
  | "settings.academic_year"
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

