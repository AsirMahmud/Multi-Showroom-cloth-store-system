"use client";

import { useAuth } from "@/contexts/auth-context";
import type { PermissionCode } from "@/types/auth";

/**
 * Returns `true` if the current user has the supplied permission code.
 * Admins always pass. Returns `false` while authentication is loading.
 *
 * Pass an array to require ANY of the listed permissions (logical OR).
 */
export function usePermission(
  code: PermissionCode | PermissionCode[]
): boolean {
  const { user, hasPermission } = useAuth();
  if (!user) return false;
  if (user.role === "admin") return true;
  if (Array.isArray(code)) return code.some((c) => hasPermission(c));
  return hasPermission(code);
}

/**
 * Returns `true` only if the current user has ALL of the supplied permission
 * codes. Useful for actions that need composed access.
 */
export function useAllPermissions(codes: PermissionCode[]): boolean {
  const { user, hasPermission } = useAuth();
  if (!user) return false;
  if (user.role === "admin") return true;
  return codes.every((c) => hasPermission(c));
}
