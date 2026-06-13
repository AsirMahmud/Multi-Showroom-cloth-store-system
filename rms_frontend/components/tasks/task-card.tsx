"use client"

import { useState } from "react"
import { useTasks, type Task, type TaskStatus } from "@/context/task-context"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { TaskDetailsDialog } from "@/components/tasks/task-details-dialog"
import { Calendar, MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface TaskCardProps {
  task: Task
}

export function TaskCard({ task }: TaskCardProps) {
  const { updateTask, deleteTask } = useTasks()
  const [detailsOpen, setDetailsOpen] = useState(false)

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(date)
  }

  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
  }

  // Get priority badge color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-rose-100 text-rose-700"
      case "medium":
        return "bg-amber-100 text-amber-700"
      case "low":
        return "bg-emerald-100 text-emerald-700"
      default:
        return "bg-slate-100 text-slate-700"
    }
  }

  // Get category badge color
  const getCategoryColor = (category: string) => {
    switch (category) {
      case "inventory":
        return "bg-purple-100 text-purple-700"
      case "staff":
        return "bg-brand-primary/10 text-brand-primary"
      case "marketing":
        return "bg-rose-100 text-rose-700"
      case "reports":
        return "bg-indigo-100 text-indigo-700"
      case "finances":
        return "bg-emerald-100 text-emerald-700"
      default:
        return "bg-slate-100 text-slate-700"
    }
  }

  // Update task status
  const updateStatus = (newStatus: TaskStatus) => {
    updateTask(task.id, {
      status: newStatus,
      completedAt: newStatus === "completed" ? new Date().toISOString() : undefined,
    })
  }

  // Check if task is overdue
  const isOverdue = () => {
    if (task.status === "completed") return false
    const dueDate = new Date(task.dueDate)
    const now = new Date()
    return dueDate < now
  }

  return (
    <>
      <div 
        onClick={() => setDetailsOpen(true)}
        className="group bg-white/50 backdrop-blur-sm border border-brand-primary/5 rounded-2xl p-4 shadow-sm hover:shadow-premium hover:bg-white transition-all cursor-pointer relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-1 h-full bg-brand-primary opacity-0 group-hover:opacity-100 transition-opacity" />
        
        <div className="space-y-4">
          <div className="flex justify-between items-start gap-2">
            <h3 className="text-xs font-black text-slate-900 leading-tight group-hover:text-brand-primary transition-colors line-clamp-2 uppercase tracking-tight">{task.title}</h3>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-brand-primary hover:bg-slate-50 rounded-lg shrink-0">
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl border-brand-primary/5 shadow-xl">
                <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Task Control</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-[11px] font-bold py-2.5 cursor-pointer" onClick={() => setDetailsOpen(true)}>
                  Full Report
                </DropdownMenuItem>
                <DropdownMenuItem className="text-[11px] font-bold py-2.5 cursor-pointer" onClick={() => updateStatus("pending")}>
                  Queue Back
                </DropdownMenuItem>
                <DropdownMenuItem className="text-[11px] font-bold py-2.5 cursor-pointer" onClick={() => updateStatus("in-progress")}>
                  Mark Active
                </DropdownMenuItem>
                <DropdownMenuItem className="text-[11px] font-bold py-2.5 cursor-pointer" onClick={() => updateStatus("completed")}>
                  Verify Done
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-rose-600 text-[11px] font-black py-2.5 cursor-pointer" onClick={() => deleteTask(task.id)}>
                  Abort Task
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <Badge className={cn("rounded-md border-none px-2 py-0.5 text-[9px] font-black uppercase tracking-widest", getPriorityColor(task.priority))}>
              {task.priority}
            </Badge>
            <Badge className={cn("rounded-md border-none px-2 py-0.5 text-[9px] font-black uppercase tracking-widest", getCategoryColor(task.category))}>
              {task.category}
            </Badge>
          </div>

          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6 ring-2 ring-white shadow-sm">
                <AvatarFallback className="text-[9px] font-black bg-brand-secondary text-brand-primary">{getInitials(task.assignedTo)}</AvatarFallback>
              </Avatar>
              <span className="text-[10px] font-bold text-slate-400 truncate max-w-[80px]">{task.assignedTo.split(' ')[0]}</span>
            </div>
            
            <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 rounded-lg">
              <Calendar className="h-3 w-3 text-slate-400" />
              <span className={cn(
                "text-[9px] font-black uppercase tracking-tighter",
                isOverdue() ? "text-rose-600" : "text-slate-500"
              )}>
                {formatDate(task.dueDate)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <TaskDetailsDialog task={task} open={detailsOpen} onOpenChange={setDetailsOpen} />
    </>
  )
}
