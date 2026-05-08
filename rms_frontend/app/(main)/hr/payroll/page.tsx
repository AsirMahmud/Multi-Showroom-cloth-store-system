import { RoleGuard } from "@/components/auth/role-guard";
import { PayrollTable } from "@/components/hr/payroll-table";

export default function HRPayrollPage() {
  return (
    <RoleGuard allow={["admin", "hr"]}>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Payroll</h1>
        <PayrollTable />
      </div>
    </RoleGuard>
  );
}
