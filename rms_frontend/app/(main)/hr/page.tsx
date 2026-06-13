import { RoleGuard } from "@/components/auth/role-guard";
import { ManagerDirectory } from "@/components/hr/manager-directory";
import { HRDashboard } from "@/components/hr/hr-dashboard";

export default function HRPage() {
  return (
    <RoleGuard allow={["admin", "hr", "branch_manager"]}>
      <HRDashboard />
    </RoleGuard>
  );
}
