import { useQuery } from "@tanstack/react-query";
import { auditLogApi, type AuditLogFilters } from "@/lib/api/audit-log";

export function useAuditLog(filters: AuditLogFilters = {}) {
  return useQuery({
    queryKey: ["audit-log", filters],
    queryFn: () => auditLogApi.list(filters),
  });
}
