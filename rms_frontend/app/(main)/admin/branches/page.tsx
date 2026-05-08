import { RoleGuard } from "@/components/auth/role-guard";
import { BranchManagement } from "@/components/admin/branch-management";

export default function AdminBranchesPage() {
  return (
    <RoleGuard allow={["admin"]}>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Branches</h1>
        <BranchManagement />
      </div>
    </RoleGuard>
  );
}
