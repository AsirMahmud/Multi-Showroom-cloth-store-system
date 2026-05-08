import { RoleGuard } from "@/components/auth/role-guard";
import { EmployeeTable } from "@/components/hr/employee-table";

export default function HREmployeesPage() {
  return (
    <RoleGuard allow={["admin", "hr", "branch_manager"]}>
      <EmployeeTable />
    </RoleGuard>
  );
}
