import axiosInstance from "@/lib/api/axios-config";

export interface StockTransferItem {
  id?: number;
  product: number;
  product_name?: string;
  variation?: number | null;
  variation_label?: string;
  quantity: number;
}

export interface StockTransfer {
  id: number;
  source_branch: number;
  source_branch_name: string;
  dest_branch: number;
  dest_branch_name: string;
  status: "PENDING" | "APPROVED" | "COMPLETED" | "CANCELLED";
  notes: string;
  requested_by: number | null;
  requested_by_name: string | null;
  approved_by: number | null;
  approved_by_name: string | null;
  items: StockTransferItem[];
  created_at: string;
  updated_at: string;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface CreateTransferPayload {
  source_branch: number;
  dest_branch: number;
  notes?: string;
  items: { product: number; variation?: number; quantity: number }[];
}

export const transfersApi = {
  list: async (params?: { status?: string; page?: number }) => {
    const res = await axiosInstance.get<PaginatedResponse<StockTransfer>>(
      "/inventory/transfers/",
      { params }
    );
    return res.data;
  },

  getById: async (id: number) => {
    const res = await axiosInstance.get<StockTransfer>(
      `/inventory/transfers/${id}/`
    );
    return res.data;
  },

  create: async (payload: CreateTransferPayload) => {
    const res = await axiosInstance.post<StockTransfer>(
      "/inventory/transfers/",
      payload
    );
    return res.data;
  },

  approve: async (id: number) => {
    const res = await axiosInstance.post<StockTransfer>(
      `/inventory/transfers/${id}/approve/`
    );
    return res.data;
  },

  complete: async (id: number) => {
    const res = await axiosInstance.post<StockTransfer>(
      `/inventory/transfers/${id}/complete/`
    );
    return res.data;
  },

  cancel: async (id: number) => {
    const res = await axiosInstance.post<StockTransfer>(
      `/inventory/transfers/${id}/cancel/`
    );
    return res.data;
  },
};
