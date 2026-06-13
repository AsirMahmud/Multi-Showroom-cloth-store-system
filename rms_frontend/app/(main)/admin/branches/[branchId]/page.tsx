import { RoleGuard } from "@/components/auth/role-guard";

export default function AdminBranchDetailPage({
  params,
}: {
  params: { branchId: string };
}) {
  return (
    <RoleGuard allow={["admin"]}>
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Branch {params.branchId}</h1>
        <p className="text-muted-foreground">
          Use this page to view branch-specific dashboards and reports.
        </p>
      </div>
    </RoleGuard>
  );
}
