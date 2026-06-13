import axiosInstance from "@/lib/api/axios-config";

export interface PermissionCatalogItem {
  id: number;
  code: string;
  name: string;
  description: string;
  category: "global" | "branch" | "system";
}

export interface RoleDefaults {
  admin: string[];
  branch_manager: string[];
  hr: string[];
}

export interface UserPermissions {
  user_id: number;
  username: string;
  role: "admin" | "branch_manager" | "hr";
  default_codes: string[];
  granted_codes: string[];
  effective_codes: string[];
}

const BASE = "/auth";

export const permissionsApi = {
  catalog: async (): Promise<PermissionCatalogItem[]> => {
    const { data } = await axiosInstance.get(`${BASE}/permissions/`);
    return data;
  },
  roleDefaults: async (): Promise<RoleDefaults> => {
    const { data } = await axiosInstance.get(`${BASE}/role-defaults/`);
    return data;
  },
  forUser: async (userId: number): Promise<UserPermissions> => {
    const { data } = await axiosInstance.get(
      `${BASE}/users/${userId}/permissions/`
    );
    return data;
  },
  setForUser: async (userId: number, codes: string[]): Promise<UserPermissions> => {
    const { data } = await axiosInstance.put(
      `${BASE}/users/${userId}/permissions/`,
      { codes }
    );
    return data;
  },
  grant: async (userId: number, code: string): Promise<void> => {
    await axiosInstance.post(`${BASE}/users/${userId}/permissions/${code}/`);
  },
  revoke: async (userId: number, code: string): Promise<void> => {
    await axiosInstance.delete(`${BASE}/users/${userId}/permissions/${code}/`);
  },
};
