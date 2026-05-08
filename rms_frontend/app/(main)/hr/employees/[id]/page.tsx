import { RoleGuard } from "@/components/auth/role-guard";
import { EmployeeDashboard } from "@/components/hr/employee-dashboard";

export default function EmployeeRecordPage({ params }: { params: { id: string } }) {
  return (
    <RoleGuard allow={["admin", "hr", "branch_manager"]}>
      <EmployeeDashboard employeeId={params.id} />
    </RoleGuard>
  );
}
