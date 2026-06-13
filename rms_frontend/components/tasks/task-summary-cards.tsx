"use client"

import { MetricCard } from "@/components/ui/professional"
import { useTasks } from "@/context/task-context"
import { CheckCircle, Clock, AlertTriangle, ListChecks } from "lucide-react"

export function TaskSummaryCards() {
  const { tasks } = useTasks()

  // Calculate task statistics
  const totalTasks = tasks.length
  const completedTasks = tasks.filter((task) => task.status === "completed").length
  const pendingTasks = tasks.filter((task) => task.status === "pending").length
  const inProgressTasks = tasks.filter((task) => task.status === "in-progress").length

  // Calculate overdue tasks
  const overdueTasks = tasks.filter((task) => {
    if (task.status === "completed") return false
    const dueDate = new Date(task.dueDate)
    const now = new Date()
    return dueDate < now
  }).length

  // Calculate completion rate
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        label="Total Backlog"
        value={totalTasks}
        icon={<ListChecks className="h-5 w-5" />}
        tone="brand"
        helper={`${completedTasks} finished, ${pendingTasks + inProgressTasks} active`}
      />

      <MetricCard
        label="Active Cycle"
        value={inProgressTasks}
        icon={<Clock className="h-5 w-5" />}
        tone="amber"
        helper={inProgressTasks > 0 ? `${Math.round((inProgressTasks / totalTasks) * 100)}% of total load` : "System idle"}
      />

      <MetricCard
        label="Fulfillment"
        value={`${completionRate}%`}
        icon={<CheckCircle className="h-5 w-5" />}
        tone="emerald"
        helper={`${completedTasks} verified completions`}
      />

      <MetricCard
        label="Critical Delay"
        value={overdueTasks}
        icon={<AlertTriangle className="h-5 w-5" />}
        tone="rose"
        helper={overdueTasks > 0 ? "Immediate attention required" : "No outstanding lags"}
      />
    </div>
  )
}
