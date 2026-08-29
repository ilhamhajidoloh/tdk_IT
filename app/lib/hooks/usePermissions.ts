"use client";

import { useMemo } from "react";
import { useAuth } from "@/app/lib/useAuth";
import { Permission, AdminPermissions } from "@/app/lib/permissions/types";
import {
  hasPermission as checkPermission,
  hasAnyPermission as checkAnyPermission,
  hasAllPermissions as checkAllPermissions,
  isFullAdmin as checkFullAdmin,
  isCoAdmin as checkCoAdmin,
  canAccessAdmin as checkCanAccessAdmin,
  countActivePermissions,
} from "@/app/lib/permissions/checker";

export function usePermissions() {
  const { user, loading } = useAuth();

  const isFullAdmin = useMemo(() => checkFullAdmin(user), [user]);
  const isCoAdmin = useMemo(() => checkCoAdmin(user), [user]);
  const canAccessAdmin = useMemo(() => checkCanAccessAdmin(user), [user]);
  const permissions = useMemo(() => (user?.admin_permissions as AdminPermissions) || null, [user]);

  const activePermissionsCount = useMemo(() => {
    if (isFullAdmin) return 999;
    return countActivePermissions(permissions);
  }, [isFullAdmin, permissions]);

  const hasPermission = useMemo(() => {
    return (perm: Permission): boolean => {
      if (!user) return false;
      return checkPermission(user, perm);
    };
  }, [user]);

  const hasAnyPermission = useMemo(() => {
    return (...perms: Permission[]): boolean => {
      if (!user) return false;
      return checkAnyPermission(user, ...perms);
    };
  }, [user]);

  const hasAllPermissions = useMemo(() => {
    return (...perms: Permission[]): boolean => {
      if (!user) return false;
      return checkAllPermissions(user, ...perms);
    };
  }, [user]);

  return {
    user,
    loading,
    isFullAdmin,
    isCoAdmin,
    canAccessAdmin,
    permissions,
    activePermissionsCount,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  };
}

