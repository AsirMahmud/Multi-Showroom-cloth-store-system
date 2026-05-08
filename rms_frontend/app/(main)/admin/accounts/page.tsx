import { RoleGuard } from "@/components/auth/role-guard";
import { AccountCenter } from "@/components/admin/account-center";
import { AccountCreateForm } from "@/components/admin/account-create-form";

export default function AccountCenterPage() {
  return (
    <RoleGuard allow={["admin"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Account Center
          </h1>
          <p className="text-sm text-muted-foreground">
            Onboard new staff and manage existing accounts across all branches.
          </p>
        </div>
        <AccountCreateForm />
        <AccountCenter />
      </div>
    </RoleGuard>
  );
}
