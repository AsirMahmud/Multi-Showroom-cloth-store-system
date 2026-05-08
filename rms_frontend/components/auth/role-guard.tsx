"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/contexts/auth-context";
import type { UserRole } from "@/types/auth";

export function RoleGuard({
  allow,
  children,
}: {
  allow: UserRole[];
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isLoading, user } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!user || !allow.includes(user.role)) {
      router.push("/");
    }
  }, [allow, isLoading, router, user]);

  if (isLoading || !user || !allow.includes(user.role)) {
    return null;
  }
  return <>{children}</>;
}
