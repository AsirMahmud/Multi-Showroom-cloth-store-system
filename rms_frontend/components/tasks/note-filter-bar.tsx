"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter, Plus, Activity } from "lucide-react"
import { useTasks } from "@/context/task-context"
import { CreateNoteDialog } from "@/components/tasks/create-note-dialog"

export function NoteFilterBar() {
  const { noteCategories } = useTasks()
  const [searchTerm, setSearchTerm] = useState("")
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  // Add "all" to categories
  const categories = ["all", ...noteCategories]

  return (
    <div className="flex flex-col md:flex-row items-center gap-4">
      <div className="flex flex-1 items-center gap-3 w-full">
        <div className="relative flex-1 md:max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <Input
            placeholder="Search Intelligence..."
            className="pl-10 h-11 bg-white/50 backdrop-blur-md border-slate-100 rounded-2xl focus:ring-brand-primary/20 transition-all font-bold text-xs"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Select defaultValue="all">
          <SelectTrigger className="h-11 w-[160px] bg-white/50 backdrop-blur-md border-slate-100 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-sm">
            <SelectValue placeholder="Protocol" />
          </SelectTrigger>
          <SelectContent className="rounded-2xl border-slate-100 shadow-xl">
            {categories.map((category) => (
              <SelectItem key={category} value={category} className="text-[10px] font-black uppercase tracking-widest py-2.5">
                {category === "all" ? "Full Archive" : category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="outline" size="icon" className="h-11 w-11 rounded-2xl border-slate-100 bg-white/50 hover:bg-white transition-all shadow-sm">
          <Filter className="h-4 w-4 text-slate-500" />
        </Button>
      </div>

      <Button 
        onClick={() => setCreateDialogOpen(true)}
        className="h-11 px-6 bg-brand-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-brand-primary/20 hover:shadow-xl transition-all w-full md:w-auto"
      >
        <Plus className="mr-2 h-4 w-4" />
        New Intelligence Log
      </Button>

      <CreateNoteDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
    </div>
  )
}
