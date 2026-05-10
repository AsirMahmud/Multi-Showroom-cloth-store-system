"use client";

import { RoleGuard } from "@/components/auth/role-guard";
import { RolesAndPermissions } from "@/components/admin/roles-and-permissions";
import { PageHeader } from "@/components/ui/professional";
import { ShieldCheck } from "lucide-react";
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

export default function RolesPage() {
  return (
    <RoleGuard allow={["admin"]}>
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-8"
      >
        <PageHeader
          title="Security Matrix"
          description="Orchestrate granular access control and define operational boundaries for your organizational hierarchy."
          icon={<ShieldCheck className="h-6 w-6" />}
        />
        
        <motion.div variants={item}>
          <RolesAndPermissions />
        </motion.div>
      </motion.div>
    </RoleGuard>
  );
}
