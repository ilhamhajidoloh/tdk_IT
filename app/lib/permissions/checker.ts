import { AdminPermissions, Permission, PermissionCategory, PermissionAction } from "./types";

export interface UserPermissionContext {
  role?: string;
  is_co_admin?: boolean;
  admin_permissions?: AdminPermissions | null;
}

/**
 * Check if the user is a Full Admin (or Super Admin)
 */
export function isFullAdmin(userOrRole?: UserPermissionContext | string | null): boolean {
  if (!userOrRole) return false;
  const role = typeof userOrRole === "string" ? userOrRole : userOrRole.role;
  return role === "admin" || role === "super_admin";
}

/**
 * Check if the user is explicitly flagged as a Co-admin
 */
export function isCoAdmin(user?: UserPermissionContext | null): boolean {
  if (!user) return false;
  return user.is_co_admin === true;
}

/**
 * Check if the user can access the /admin portal (either Full Admin or Co-admin)
 */
export function canAccessAdmin(user?: UserPermissionContext | null): boolean {
  if (!user) return false;
  return isFullAdmin(user) || isCoAdmin(user);
}

/**
 * Check single permission. Full Admin always returns true.
 */
export function hasPermission(
  userOrPermissions: UserPermissionContext | AdminPermissions | null | undefined,
  permission: Permission
): boolean {
  if (!userOrPermissions) return false;

  // If Full Admin, always pass
  if ("role" in userOrPermissions && isFullAdmin(userOrPermissions)) {
    return true;
  }

  // Extract permissions object
  const permissions: AdminPermissions | null | undefined =
    "admin_permissions" in userOrPermissions
      ? userOrPermissions.admin_permissions
      : (userOrPermissions as AdminPermissions);

  if (!permissions) return false;

  const [category, action] = permission.split(".") as [PermissionCategory, PermissionAction];
  if (!category || !action) return false;

  return permissions[category]?.[action] === true;
}

/**
 * Check if user has ANY of the given permissions
 */
export function hasAnyPermission(
  userOrPermissions: UserPermissionContext | AdminPermissions | null | undefined,
  ...permissions: Permission[]
): boolean {
  if (!userOrPermissions) return false;
  if ("role" in userOrPermissions && isFullAdmin(userOrPermissions)) {
    return true;
  }
  if (permissions.length === 0) return true;
  return permissions.some((p) => hasPermission(userOrPermissions, p));
}

/**
 * Check if user has ALL of the given permissions
 */
export function hasAllPermissions(
  userOrPermissions: UserPermissionContext | AdminPermissions | null | undefined,
  ...permissions: Permission[]
): boolean {
  if (!userOrPermissions) return false;
  if ("role" in userOrPermissions && isFullAdmin(userOrPermissions)) {
    return true;
  }
  if (permissions.length === 0) return true;
  return permissions.every((p) => hasPermission(userOrPermissions, p));
}

/**
 * Count total number of active granted permissions in an AdminPermissions object
 */
export function countActivePermissions(permissions: AdminPermissions | null | undefined): number {
  if (!permissions) return 0;
  let count = 0;
  for (const cat of Object.values(permissions)) {
    if (!cat) continue;
    for (const granted of Object.values(cat)) {
      if (granted === true) count++;
    }
  }
  return count;
}

