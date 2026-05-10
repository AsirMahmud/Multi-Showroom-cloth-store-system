"use client";

import { RoleGuard } from "@/components/auth/role-guard";
import { BranchManagement } from "@/components/admin/branch-management";
import { PageHeader } from "@/components/ui/professional";
import { Building2 } from "lucide-react";
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

export default function AdminBranchesPage() {
  return (
    <RoleGuard allow={["admin"]}>
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-8"
      >
        <PageHeader
          title="Branch Management"
          description="Initialize and configure organizational nodes for localized inventory and staff auditing."
          icon={<Building2 className="h-6 w-6" />}
        />
        
        <motion.div variants={item}>
          <BranchManagement />
        </motion.div>
      </motion.div>
    </RoleGuard>
  );
}
