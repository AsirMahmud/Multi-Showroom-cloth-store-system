import { RoleGuard } from "@/components/auth/role-guard";
import { BranchManagement } from "@/components/admin/branch-management";
import { FinancialOverview } from "@/components/admin/financial-overview";
import { AccountCreateForm } from "@/components/admin/account-create-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRightLeft, Building2, ShieldCheck, Users, Activity, BarChart3 } from "lucide-react";
import Link from "next/link";

const adminModules = [
  {
    title: "Branches",
    description: "Manage multiple branches, their inventory, and staff.",
    icon: Building2,
    href: "/admin/branches",
    color: "text-blue-500",
    bg: "bg-blue-50",
  },
  {
    title: "Inter-Branch Transfers",
    description: "Move stock seamlessly between different branches.",
    icon: ArrowRightLeft,
    href: "/admin/transfers",
    color: "text-emerald-500",
    bg: "bg-emerald-50",
  },
  {
    title: "Roles & Permissions",
    description: "Configure granular access control for your organization.",
    icon: ShieldCheck,
    href: "/admin/roles",
    color: "text-indigo-500",
    bg: "bg-indigo-50",
  },
  {
    title: "User Accounts",
    description: "Create and manage system users and assign roles.",
    icon: Users,
    href: "/admin/accounts",
    color: "text-violet-500",
    bg: "bg-violet-50",
  },
  {
    title: "Audit Logs",
    description: "Track system activities and monitor security events.",
    icon: Activity,
    href: "/admin/audit-log",
    color: "text-amber-500",
    bg: "bg-amber-50",
  },
  {
    title: "Financial Reports",
    description: "Global overview of multi-branch revenue and expenses.",
    icon: BarChart3,
    href: "/admin/financial-overview",
    color: "text-rose-500",
    bg: "bg-rose-50",
  },
];

export default function AdminPage() {
  return (
    <RoleGuard allow={["admin"]}>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Admin Control Panel</h1>
          <p className="text-muted-foreground mt-2">
            Centralized management for your multi-branch retail system.
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-slate-100/50 p-1">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="branches">Branches</TabsTrigger>
            <TabsTrigger value="accounts">Create Account</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8">
            <FinancialOverview />
            
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Multi-Branch Features</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {adminModules.map((module) => (
                  <Link key={module.href} href={module.href}>
                    <Card className="hover:border-slate-300 transition-colors cursor-pointer h-full border-slate-200/80 shadow-sm hover:shadow-md">
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${module.bg}`}>
                            <module.icon className={`h-5 w-5 ${module.color}`} />
                          </div>
                          <CardTitle className="text-base">{module.title}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <CardDescription className="text-sm">
                          {module.description}
                        </CardDescription>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="branches">
            <BranchManagement />
          </TabsContent>

          <TabsContent value="accounts">
            <div className="max-w-2xl">
              <AccountCreateForm />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </RoleGuard>
  );
}
