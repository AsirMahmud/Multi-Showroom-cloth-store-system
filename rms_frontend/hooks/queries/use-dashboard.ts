import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/lib/api/axios-config";
import { DashboardStats } from "@/types/dashboard";
import { useBranch } from "@/contexts/branch-context";

export function useDashboard() {
  const { selectedBranchId, selectionMade } = useBranch();
  return useQuery<DashboardStats>({
    // Including the branch in the key prevents cross-branch data bleeding through cache.
    queryKey: ["dashboard-stats", selectedBranchId ?? "all"],
    queryFn: async () => {
      try {
        const response = await axiosInstance.get("/dashboard/stats/");
        return response.data;
      } catch (error) {
        console.error("Dashboard data fetch error:", error);
        throw error;
      }
    },
    // Wait until the user has actually picked a branch (or "All Branches").
    enabled: selectionMade,
    refetchInterval: 300000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 60000,
    gcTime: 300000,
  });
}
