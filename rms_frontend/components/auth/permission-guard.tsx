"use client";

import { ShieldAlert } from "lucide-react";

import { useAuth } from "@/contexts/auth-context";
import type { PermissionCode, UserRole } from "@/types/auth";

interface PermissionGuardProps {
  /** Required role (any one of these passes). */
  roles?: UserRole[];
  /** Required permission code(s). User must hold at least one. */
  permissions?: PermissionCode | PermissionCode[];
  /** Required permissions where user must hold ALL listed codes. */
  requireAll?: PermissionCode[];
  /** Custom forbidden UI; defaults to a friendly inline card. */
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Inline permission-aware guard. Renders `children` if the current user passes
 * the role/permission check, otherwise renders a "no access" card.
 *
 * Does not redirect. Use {@link RoleGuard} for full-page redirects.
 */
export function PermissionGuard({
  roles,
  permissions,
  requireAll,
  fallback,
  children,
}: PermissionGuardProps) {
  const { user, hasPermission, isLoading } = useAuth();

  if (isLoading) return null;
  if (!user) return null;

  if (user.role === "admin") return <>{children}</>;

  if (roles && !roles.includes(user.role)) {
    return <>{fallback ?? <ForbiddenCard />}</>;
  }

  if (permissions) {
    const codes = Array.isArray(permissions) ? permissions : [permissions];
    if (!codes.some((code) => hasPermission(code))) {
      return <>{fallback ?? <ForbiddenCard />}</>;
    }
  }

  if (requireAll && !requireAll.every((code) => hasPermission(code))) {
    return <>{fallback ?? <ForbiddenCard />}</>;
  }

  return <>{children}</>;
}

function ForbiddenCard() {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-8 text-center">
      <ShieldAlert className="mx-auto h-10 w-10 text-amber-600" />
      <h3 className="mt-3 text-lg font-semibold text-amber-900">
        You don&apos;t have access to this section
      </h3>
      <p className="mt-1 text-sm text-amber-700">
        Ask an administrator to grant you the required permission.
      </p>
    </div>
  );
}
