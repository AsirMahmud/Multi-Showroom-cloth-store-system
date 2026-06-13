"use client";

import { RoleGuard } from "@/components/auth/role-guard";
import { PayrollTable } from "@/components/hr/payroll-table";
import { PageHeader } from "@/components/ui/professional";
import { Wallet } from "lucide-react";
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

export default function HRPayrollPage() {
  return (
    <RoleGuard allow={["admin", "hr"]}>
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-8"
      >
        <PageHeader
          title="Payroll Orchestration"
          description="Global compensation management and multi-branch liability settlement."
          icon={<Wallet className="h-6 w-6" />}
        />
        
        <motion.div variants={item}>
          <PayrollTable />
        </motion.div>
      </motion.div>
    </RoleGuard>
  );
}
