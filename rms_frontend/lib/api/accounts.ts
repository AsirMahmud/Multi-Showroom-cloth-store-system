import axiosInstance from "@/lib/api/axios-config";
import type { Account, AccountUpdatePayload, StaffAccountPayload } from "@/types/hr";

const BASE = "/branches/admin/accounts/";

export const accountsApi = {
  list: async (): Promise<Account[]> => {
    const { data } = await axiosInstance.get(BASE);
    return Array.isArray(data) ? data : data.results ?? [];
  },
  get: async (id: number): Promise<Account> => {
    const { data } = await axiosInstance.get(`${BASE}${id}/`);
    return data;
  },
  create: async (payload: StaffAccountPayload): Promise<Account> => {
    const { data } = await axiosInstance.post(BASE, payload);
    return data;
  },
  update: async (
    id: number,
    payload: AccountUpdatePayload
  ): Promise<Account> => {
    const { data } = await axiosInstance.patch(`${BASE}${id}/`, payload);
    return data;
  },
  deactivate: async (id: number): Promise<Account> => {
    const { data } = await axiosInstance.post(`${BASE}${id}/deactivate/`);
    return data;
  },
  activate: async (id: number): Promise<Account> => {
    const { data } = await axiosInstance.post(`${BASE}${id}/activate/`);
    return data;
  },
  resetPassword: async (id: number, newPassword: string): Promise<void> => {
    await axiosInstance.post(`${BASE}${id}/reset-password/`, {
      new_password: newPassword,
    });
  },
  remove: async (id: number): Promise<void> => {
    await axiosInstance.delete(`${BASE}${id}/`);
  },
};
