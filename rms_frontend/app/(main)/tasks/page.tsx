"use client";

import { TaskBoard } from "@/components/tasks/task-board"
import { TaskSummaryCards } from "@/components/tasks/task-summary-cards"
import { TaskFilterBar } from "@/components/tasks/task-filter-bar"
import { PageHeader } from "@/components/ui/professional"
import { ClipboardList } from "lucide-react"
import { motion } from "framer-motion"

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

export default function TasksPage() {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      <PageHeader
        title="Operation Control"
        description="Agile task board for real-time retail workflows and personnel assignments."
        icon={<ClipboardList className="h-6 w-6" />}
        actions={<TaskFilterBar />}
      />

      <motion.div variants={item}>
        <TaskSummaryCards />
      </motion.div>

      <motion.div variants={item}>
        <TaskBoard />
      </motion.div>
    </motion.div>
  )
}
