import { RoleGuard } from "@/components/auth/role-guard";
import { RolesAndPermissions } from "@/components/admin/roles-and-permissions";

export default function RolesPage() {
  return (
    <RoleGuard allow={["admin"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Roles &amp; Permissions
          </h1>
          <p className="text-sm text-muted-foreground">
            Inspect role defaults and grant individual permissions to staff.
          </p>
        </div>
        <RolesAndPermissions />
      </div>
    </RoleGuard>
  );
}
