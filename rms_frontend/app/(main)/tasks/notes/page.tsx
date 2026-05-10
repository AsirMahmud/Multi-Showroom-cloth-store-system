import type { Metadata } from "next"
import { NotesList } from "@/components/tasks/notes-list"
import { NoteFilterBar } from "@/components/tasks/note-filter-bar"
import { PageHeader } from "@/components/ui/professional"
import { StickyNote } from "lucide-react"

export const metadata: Metadata = {
  title: "Notes | Professional Retail Management",
  description: "View and manage store notes and important information",
}

export default function NotesPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Intelligence Logs"
        description="Archive and management of store observations, notices, and internal directives."
        icon={<StickyNote className="h-5 w-5" />}
        action={<NoteFilterBar />}
      />

      <NotesList />
    </div>
  )
}
