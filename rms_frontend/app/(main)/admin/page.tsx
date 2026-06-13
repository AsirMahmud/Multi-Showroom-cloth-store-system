"use client";

import { RoleGuard } from "@/components/auth/role-guard";
import { BranchManagement } from "@/components/admin/branch-management";
import { FinancialOverview } from "@/components/admin/financial-overview";
import { AccountCreateForm } from "@/components/admin/account-create-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader, DataPanel } from "@/components/ui/professional";
import { 
  ArrowRightLeft, 
  Building2, 
  ShieldCheck, 
  Users, 
  Activity, 
  BarChart3,
  LayoutDashboard,
  Store,
  UserPlus
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const adminModules = [
  {
    title: "Branches",
    description: "Manage multiple branches, their inventory, and staff.",
    icon: Building2,
    href: "/admin/branches",
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    title: "Inter-Branch Transfers",
    description: "Move stock seamlessly between different branches.",
    icon: ArrowRightLeft,
    href: "/admin/transfers",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    title: "Roles & Permissions",
    description: "Configure granular access control for your organization.",
    icon: ShieldCheck,
    href: "/admin/roles",
    color: "text-indigo-600",
    bg: "bg-indigo-50",
  },
  {
    title: "User Accounts",
    description: "Create and manage system users and assign roles.",
    icon: Users,
    href: "/admin/accounts",
    color: "text-violet-600",
    bg: "bg-violet-50",
  },
  {
    title: "Audit Logs",
    description: "Track system activities and monitor security events.",
    icon: Activity,
    href: "/admin/audit-log",
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  {
    title: "Financial Reports",
    description: "Global overview of multi-branch revenue and expenses.",
    icon: BarChart3,
    href: "/admin/financial-overview",
    color: "text-rose-600",
    bg: "bg-rose-50",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

export default function AdminPage() {
  return (
    <RoleGuard allow={["admin"]}>
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-8"
      >
        <PageHeader
          title="Organization Control"
          description="Centralized command center for multi-branch retail orchestration and infrastructure management."
          icon={<LayoutDashboard className="h-6 w-6" />}
        />

        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="bg-white/50 backdrop-blur-xl border border-brand-primary/5 shadow-premium rounded-2xl p-1 h-auto overflow-x-auto no-scrollbar">
            <TabsTrigger 
              value="overview"
              className={cn(
                "flex-1 py-2.5 rounded-xl transition-all duration-300 font-bold text-[10px] uppercase tracking-widest whitespace-nowrap",
                "data-[state=active]:bg-brand-primary data-[state=active]:text-brand-secondary data-[state=active]:shadow-lg data-[state=active]:shadow-brand-primary/20",
                "text-slate-400 hover:text-slate-600"
              )}
            >
              <Activity className="h-3.5 w-3.5 mr-2" />
              Executive Overview
            </TabsTrigger>
            <TabsTrigger 
              value="branches"
              className={cn(
                "flex-1 py-2.5 rounded-xl transition-all duration-300 font-bold text-[10px] uppercase tracking-widest whitespace-nowrap",
                "data-[state=active]:bg-brand-primary data-[state=active]:text-brand-secondary data-[state=active]:shadow-lg data-[state=active]:shadow-brand-primary/20",
                "text-slate-400 hover:text-slate-600"
              )}
            >
              <Store className="h-3.5 w-3.5 mr-2" />
              Branch Matrix
            </TabsTrigger>
            <TabsTrigger 
              value="accounts"
              className={cn(
                "flex-1 py-2.5 rounded-xl transition-all duration-300 font-bold text-[10px] uppercase tracking-widest whitespace-nowrap",
                "data-[state=active]:bg-brand-primary data-[state=active]:text-brand-secondary data-[state=active]:shadow-lg data-[state=active]:shadow-brand-primary/20",
                "text-slate-400 hover:text-slate-600"
              )}
            >
              <UserPlus className="h-3.5 w-3.5 mr-2" />
              Infrastructure Access
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8 focus-visible:outline-none">
            <motion.div variants={item}>
              <FinancialOverview />
            </motion.div>
            
            <motion.div variants={item}>
              <DataPanel
                title="Management Nodes"
                description="Specialized sub-systems for granular organization control."
              >
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {adminModules.map((module) => (
                    <Link key={module.href} href={module.href}>
                      <div className="group relative p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:bg-white hover:shadow-2xl hover:shadow-brand-primary/5 transition-all duration-500 cursor-pointer overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                          <module.icon className="h-20 w-20 text-brand-primary" />
                        </div>
                        <div className="relative z-10">
                          <div className={cn("p-3 rounded-2xl w-fit mb-4 transition-transform duration-500 group-hover:scale-110 shadow-sm", module.bg)}>
                            <module.icon className={cn("h-6 w-6", module.color)} />
                          </div>
                          <h3 className="text-sm font-black text-brand-primary mb-2 uppercase tracking-tight group-hover:text-emerald-700 transition-colors">
                            {module.title}
                          </h3>
                          <p className="text-xs text-slate-400 font-medium leading-relaxed">
                            {module.description}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </DataPanel>
            </motion.div>
          </TabsContent>

          <TabsContent value="branches" className="focus-visible:outline-none">
            <motion.div variants={item}>
              <BranchManagement />
            </motion.div>
          </TabsContent>

          <TabsContent value="accounts" className="focus-visible:outline-none">
            <motion.div variants={item} className="max-w-3xl mx-auto">
              <DataPanel
                title="Security Onboarding"
                description="Initialize high-privilege access accounts for system operators."
              >
                <AccountCreateForm />
              </DataPanel>
            </motion.div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </RoleGuard>
  );
}
