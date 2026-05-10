"use client";

import { useQuery } from "@tanstack/react-query";
import { branchesApi } from "@/lib/api/branches";
import { MetricCard } from "@/components/ui/professional";
import { useBranch } from "@/contexts/branch-context";
import { DollarSign, TrendingDown, TrendingUp } from "lucide-react";

export function FinancialOverview() {
  const { selectedBranchId } = useBranch();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "financial-overview", selectedBranchId],
    queryFn: () => branchesApi.getFinancialOverview(selectedBranchId ?? undefined),
  });

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <MetricCard
        label="Organization Inflow"
        value={`$${parseFloat(data?.total_sales ?? "0").toLocaleString()}`}
        icon={<DollarSign className="h-5 w-5" />}
        tone="brand"
        helper="Gross revenue across active nodes"
        isLoading={isLoading}
      />
      <MetricCard
        label="Operational Outflow"
        value={`$${parseFloat(data?.total_expenses ?? "0").toLocaleString()}`}
        icon={<TrendingDown className="h-5 w-5" />}
        tone="rose"
        helper="Cumulative liabilities and overhead"
        isLoading={isLoading}
      />
      <MetricCard
        label="Net Extraction"
        value={`$${parseFloat(data?.net_profit ?? "0").toLocaleString()}`}
        icon={<TrendingUp className="h-5 w-5" />}
        tone="emerald"
        helper="Total liquidity gain (after deductions)"
        isLoading={isLoading}
      />
    </div>
  );
}
