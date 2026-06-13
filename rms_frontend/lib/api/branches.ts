import axiosInstance from "@/lib/api/axios-config";
import type { Branch, StaffAccountPayload } from "@/types/hr";

export interface FinancialOverview {
  total_sales: string;
  total_expenses: string;
  net_profit: string;
  branch_id: number | null;
}

export interface BranchSummary {
  branch_id: number | null;
  today_sales: string | number;
  today_expenses: string | number;
  open_dues: string | number;
  products_in_stock: number;
  staff_count: number;
  low_stock_count: number;
}

export const branchesApi = {
  getBranches: async (): Promise<Branch[]> => {
    const { data } = await axiosInstance.get("/branches/branches/");
    return data;
  },
  getBranch: async (branchId: number): Promise<Branch> => {
    const { data } = await axiosInstance.get(`/branches/branches/${branchId}/`);
    return data;
  },
  createBranch: async (payload: { name: string; address?: string; phone?: string; is_active?: boolean }): Promise<Branch> => {
    const { data } = await axiosInstance.post("/branches/branches/", payload);
    return data;
  },
  updateBranch: async (
    branchId: number,
    payload: Partial<Branch>
  ): Promise<Branch> => {
    const { data } = await axiosInstance.patch(`/branches/branches/${branchId}/`, payload);
    return data;
  },
  getFinancialOverview: async (branchId?: number): Promise<FinancialOverview> => {
    const params = branchId ? { branch_id: branchId } : undefined;
    const { data } = await axiosInstance.get("/branches/admin/financial-overview/", {
      params,
    });
    return data;
  },
  /**
   * KPI strip for the branch selector cards.
   * Pass `null` for the aggregate "All Branches" rollup.
   * Returns `null` when the backend endpoint is not yet available so the UI
   * can degrade gracefully (KPI placeholders show "—").
   */
  getBranchSummary: async (
    branchId: number | null
  ): Promise<BranchSummary | null> => {
    const path =
      branchId === null
        ? "/branches/branches/summary/"
        : `/branches/branches/${branchId}/summary/`;
    try {
      const { data } = await axiosInstance.get(path);
      return data;
    } catch (error: unknown) {
      // Backend endpoint may not be deployed yet (Phase 2). Fail soft.
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 404 || status === 405) return null;
      throw error;
    }
  },
  createStaffAccount: async (payload: StaffAccountPayload) => {
    const { data } = await axiosInstance.post("/branches/admin/accounts/", payload);
    return data;
  },
};
