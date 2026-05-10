"use client";

import { RoleGuard } from "@/components/auth/role-guard";
import { AccountCenter } from "@/components/admin/account-center";
import { AccountCreateForm } from "@/components/admin/account-create-form";
import { PageHeader, DataPanel } from "@/components/ui/professional";
import { Users } from "lucide-react";
import { motion } from "framer-motion";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

export default function AccountCenterPage() {
  return (
    <RoleGuard allow={["admin"]}>
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-8"
      >
        <PageHeader
          title="Account Logistics"
          description="Initialize personnel access, manage branch assignments, and audit high-level organizational identities."
          icon={<Users className="h-6 w-6" />}
        />
        
        <motion.div variants={item}>
          <DataPanel
            title="Onboarding Engine"
            description="Securely provision new system operator credentials."
          >
            <div className="max-w-3xl">
              <AccountCreateForm />
            </div>
          </DataPanel>
        </motion.div>

        <motion.div variants={item}>
          <AccountCenter />
        </motion.div>
      </motion.div>
    </RoleGuard>
  );
}
