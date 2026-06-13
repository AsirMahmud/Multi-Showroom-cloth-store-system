import axiosInstance from "@/lib/api/axios-config";

export interface AuditLogEntry {
  id: number;
  actor: number | null;
  actor_username: string | null;
  action: "CREATE" | "UPDATE" | "DELETE";
  entity_type: string;
  entity_id: number;
  entity_repr: string;
  branch: number | null;
  branch_name: string | null;
  before_json: Record<string, any> | null;
  after_json: Record<string, any> | null;
  ip_address: string | null;
  created_at: string;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface AuditLogFilters {
  action?: string;
  entity_type?: string;
  branch?: number;
  actor?: number;
  created_at__gte?: string;
  created_at__lte?: string;
  page?: number;
}

export const auditLogApi = {
  list: async (params?: AuditLogFilters) => {
    const res = await axiosInstance.get<PaginatedResponse<AuditLogEntry>>(
      "/audit-log/",
      { params }
    );
    return res.data;
  },
};
