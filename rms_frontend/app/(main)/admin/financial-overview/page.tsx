import { RoleGuard } from "@/components/auth/role-guard";
import { FinancialOverview } from "@/components/admin/financial-overview";

export default function FinancialOverviewPage() {
  return (
    <RoleGuard allow={["admin"]}>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Financial Overview</h1>
        <FinancialOverview />
      </div>
    </RoleGuard>
  );
}
