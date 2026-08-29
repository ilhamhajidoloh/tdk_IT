"use client";

import { ReactNode } from "react";
import { usePermissions } from "@/app/lib/hooks/usePermissions";
import { Permission } from "@/app/lib/permissions/types";

interface PermissionGateProps {
  permission?: Permission;
  anyOf?: Permission[];
  allOf?: Permission[];
  requireFullAdmin?: boolean;
  fallback?: ReactNode;
  children: ReactNode;
}

export default function PermissionGate({
  permission,
  anyOf,
  allOf,
  requireFullAdmin,
  fallback = null,
  children,
}: PermissionGateProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, isFullAdmin } = usePermissions();

  if (requireFullAdmin) {
    return isFullAdmin ? <>{children}</> : <>{fallback}</>;
  }

  if (isFullAdmin) {
    return <>{children}</>;
  }

  if (permission && !hasPermission(permission)) {
    return <>{fallback}</>;
  }

  if (anyOf && anyOf.length > 0 && !hasAnyPermission(...anyOf)) {
    return <>{fallback}</>;
  }

  if (allOf && allOf.length > 0 && !hasAllPermissions(...allOf)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

