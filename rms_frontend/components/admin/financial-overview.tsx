"use client";

import { useQuery } from "@tanstack/react-query";

import { branchesApi } from "@/lib/api/branches";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useBranch } from "@/contexts/branch-context";

export function FinancialOverview() {
  const { selectedBranchId } = useBranch();
  const { data } = useQuery({
    queryKey: ["admin", "financial-overview", selectedBranchId],
    queryFn: () => branchesApi.getFinancialOverview(selectedBranchId ?? undefined),
  });

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Total Sales</CardTitle>
        </CardHeader>
        <CardContent>{data?.total_sales ?? "0.00"}</CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Total Expenses</CardTitle>
        </CardHeader>
        <CardContent>{data?.total_expenses ?? "0.00"}</CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Net Profit</CardTitle>
        </CardHeader>
        <CardContent>{data?.net_profit ?? "0.00"}</CardContent>
      </Card>
    </div>
  );
}
