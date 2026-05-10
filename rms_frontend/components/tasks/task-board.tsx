"use client"

import { useState } from "react"
import { useTasks } from "@/context/task-context"
import { DataPanel } from "@/components/ui/professional"
import { TaskCard } from "@/components/tasks/task-card"
import { CreateTaskDialog } from "@/components/tasks/create-task-dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus } from "lucide-react"
import { motion } from "framer-motion"

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

export function TaskBoard() {
  const { tasks } = useTasks()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  // Group tasks by status
  const pendingTasks = tasks.filter((task) => task.status === "pending")
  const inProgressTasks = tasks.filter((task) => task.status === "in-progress")
  const completedTasks = tasks.filter((task) => task.status === "completed")

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button 
          onClick={() => setCreateDialogOpen(true)}
          className="h-10 px-4 bg-brand-primary text-brand-secondary hover:bg-emerald-900 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-brand-primary/20"
        >
          <Plus className="mr-2 h-3.5 w-3.5" />
          Assign Task
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={item}>
          <DataPanel 
            title="Awaiting Dispatch" 
            description="Tasks pending initialization."
            actions={<Badge className="bg-amber-100 text-amber-700 border-none font-black text-[10px]">{pendingTasks.length}</Badge>}
          >
            <div className="space-y-4 max-h-[600px] overflow-y-auto no-scrollbar pr-1">
              {pendingTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center opacity-50">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-300">Queue Empty</div>
                </div>
              ) : (
                pendingTasks.map((task) => <TaskCard key={task.id} task={task} />)
              )}
            </div>
          </DataPanel>
        </motion.div>

        <motion.div variants={item}>
          <DataPanel 
            title="Active Execution" 
            description="Personnel currently engaged."
            actions={<Badge className="bg-brand-primary/10 text-brand-primary border-none font-black text-[10px]">{inProgressTasks.length}</Badge>}
          >
            <div className="space-y-4 max-h-[600px] overflow-y-auto no-scrollbar pr-1">
              {inProgressTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center opacity-50">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-300">No Active Ops</div>
                </div>
              ) : (
                inProgressTasks.map((task) => <TaskCard key={task.id} task={task} />)
              )}
            </div>
          </DataPanel>
        </motion.div>

        <motion.div variants={item}>
          <DataPanel 
            title="Verified Output" 
            description="Success cycle completions."
            actions={<Badge className="bg-emerald-100 text-emerald-700 border-none font-black text-[10px]">{completedTasks.length}</Badge>}
          >
            <div className="space-y-4 max-h-[600px] overflow-y-auto no-scrollbar pr-1">
              {completedTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center opacity-50">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-300">No Logged Results</div>
                </div>
              ) : (
                completedTasks.map((task) => <TaskCard key={task.id} task={task} />)
              )}
            </div>
          </DataPanel>
        </motion.div>
      </div>

      <CreateTaskDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
    </div>
  )
}
