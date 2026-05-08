"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { authApi, type LoginCredentials } from "@/lib/api/auth";
import axios from "axios";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import type { AuthUser, PermissionCode, UserRole } from "@/types/auth";

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (...roles: UserRole[]) => boolean;
  canAccessBranch: (branchId: number | null | undefined) => boolean;
  /**
   * `true` if the current user has the supplied permission code. Admins always
   * pass. Returns `false` when there is no signed-in user.
   */
  hasPermission: (code: PermissionCode | string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  const parseToken = (token: string): AuthUser | null => {
    try {
      const decoded = jwtDecode<Record<string, unknown>>(token);
      const role = (decoded.role as UserRole) || "admin";
      const managedBranchId = (decoded.managed_branch_id as number | null) ?? null;
      const branchIds = Array.isArray(decoded.branch_ids)
        ? decoded.branch_ids.map((id) => Number(id)).filter((n) => !Number.isNaN(n))
        : managedBranchId
        ? [managedBranchId]
        : [];
      const permissions = Array.isArray(decoded.permissions)
        ? (decoded.permissions as unknown[]).map(String)
        : [];
      return {
        username: String(decoded.username || ""),
        role,
        managedBranchId,
        branchIds,
        permissions,
      };
    } catch {
      return null;
    }
  };

  const isTokenExpired = (token: string): boolean => {
    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      return decoded.exp ? decoded.exp < currentTime : true;
    } catch {
      return true;
    }
  };

  useEffect(() => {
    const checkAuth = () => {
      const token = Cookies.get("token");
      if (!token || isTokenExpired(token)) {
        setIsAuthenticated(false);
        setIsLoading(false);
        Cookies.remove("token");
        delete axios.defaults.headers.common["Authorization"];
        if (typeof window !== "undefined") {
          localStorage.removeItem("selectedBranchId");
          localStorage.removeItem("branchSelectionMade");
        }
        setUser(null);
        // Redirect to login if not on login page
        if (!pathname?.startsWith("/login")) {
          router.push("/login");
        }
        return;
      }

      // Set token in axios headers
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      setUser(parseToken(token));
      setIsAuthenticated(true);

      // If on login page, redirect to dashboard

      setIsLoading(false);
    };

    checkAuth();
  }, [router, pathname]);

  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await authApi.login(credentials);
      const { access } = response;

      // Set token with expiration
      Cookies.set("token", access, {
        expires: 7,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });

      // Set token in axios headers
      axios.defaults.headers.common["Authorization"] = `Bearer ${access}`;
      setUser(parseToken(access));
      setIsAuthenticated(true);

      router.push("/");
    } catch (error) {
      throw new Error("Invalid credentials");
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      Cookies.remove("token");
      delete axios.defaults.headers.common["Authorization"];
      // Clear branch selection so the next login starts at the selector again.
      if (typeof window !== "undefined") {
        localStorage.removeItem("selectedBranchId");
        localStorage.removeItem("branchSelectionMade");
      }
      setUser(null);
      setIsAuthenticated(false);
      router.push("/login");
    }
  };

  const hasRole = (...roles: UserRole[]) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  const canAccessBranch = (branchId: number | null | undefined) => {
    if (!user || !branchId) return false;
    if (user.role === "admin") return true;
    return user.branchIds.includes(branchId);
  };

  const hasPermission = (code: PermissionCode | string) => {
    if (!user) return false;
    if (user.role === "admin") return true;
    return user.permissions.includes(code);
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        user,
        login,
        logout,
        hasRole,
        canAccessBranch,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
