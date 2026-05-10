"use client"

import { useState } from "react"
import { useTasks, type Note } from "@/context/task-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { CreateNoteDialog } from "@/components/tasks/create-note-dialog"
import { NoteDetailsDialog } from "@/components/tasks/note-details-dialog"
import { Pin, Trash, Plus, StickyNote, Clock, Tag as TagIcon, MoreHorizontal } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

export function NotesList() {
  const { notes, toggleNotePin, deleteNote } = useTasks()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    }).format(date)
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
  }

  const viewNoteDetails = (note: Note) => {
    setSelectedNote(note)
    setDetailsOpen(true)
  }

  const sortedNotes = [...notes].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1
    if (!a.pinned && b.pinned) return 1
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedNotes.length === 0 ? (
          <div className="col-span-full py-20 bg-slate-50/50 border border-dashed border-slate-200 rounded-[32px] flex flex-col items-center justify-center text-slate-400">
            <StickyNote className="h-12 w-12 mb-4 opacity-20" />
            <p className="font-black text-[10px] uppercase tracking-widest">No Intelligence nodes found.</p>
            <Button variant="ghost" className="mt-4 text-brand-primary font-black text-[10px] uppercase tracking-widest" onClick={() => setCreateDialogOpen(true)}>
              Initialize First Log
            </Button>
          </div>
        ) : (
          sortedNotes.map((note) => (
            <motion.div key={note.id} variants={item}>
              <Card
                className={cn(
                  "overflow-hidden bg-white/50 backdrop-blur-md border border-slate-100 rounded-[28px] shadow-sm hover:shadow-xl hover:border-brand-primary/10 transition-all group",
                  note.pinned && "ring-1 ring-amber-400/50 bg-amber-50/10 border-amber-100 shadow-lg shadow-amber-400/5"
                )}
              >
                <CardHeader className="p-6 pb-2 flex flex-row justify-between items-start gap-4">
                  <div className="space-y-1">
                    <CardTitle className="text-sm font-black text-slate-700 tracking-tight flex items-center gap-2 group-hover:text-brand-primary transition-colors">
                      {note.title}
                      {note.pinned && <Pin className="h-3 w-3 text-amber-500 fill-amber-500" />}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      <Clock className="h-3 w-3" />
                      {formatDate(note.createdAt)}
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl hover:bg-white" onClick={() => toggleNotePin(note.id)}>
                      <Pin className={cn("h-4 w-4", note.pinned ? "text-amber-500 fill-amber-500" : "text-slate-400")} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-xl text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                      onClick={() => deleteNote(note.id)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-6 pt-2 space-y-4">
                  <div
                    className="text-xs font-medium text-slate-500 leading-relaxed line-clamp-3 cursor-pointer"
                    onClick={() => viewNoteDetails(note)}
                  >
                    {note.content}
                  </div>
                  
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-50">
                    <Badge variant="secondary" className="bg-slate-100 text-slate-500 border-none font-black text-[9px] uppercase tracking-widest px-2 py-0.5">
                      {note.category}
                    </Badge>
                    {note.tags.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="secondary" className="bg-brand-secondary/50 text-brand-primary border-none font-black text-[9px] uppercase tracking-widest px-2 py-0.5">
                        {tag}
                      </Badge>
                    ))}
                    {note.tags.length > 2 && (
                      <Badge variant="secondary" className="bg-slate-50 text-slate-400 border-none font-black text-[9px] uppercase tracking-widest px-2 py-0.5">
                        +{note.tags.length - 2} More
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6 border-2 border-white shadow-sm">
                        <AvatarFallback className="bg-slate-100 text-slate-500 text-[8px] font-black">
                          {getInitials(note.createdBy)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{note.createdBy}</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 rounded-xl px-4 text-brand-primary font-black text-[10px] uppercase tracking-widest hover:bg-brand-secondary/50" 
                      onClick={() => viewNoteDetails(note)}
                    >
                      Access Log
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      <CreateNoteDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />

      {selectedNote && <NoteDetailsDialog note={selectedNote} open={detailsOpen} onOpenChange={setDetailsOpen} />}
    </>
  )
}
