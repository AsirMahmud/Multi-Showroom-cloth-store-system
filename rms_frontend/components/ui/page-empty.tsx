"use client";

import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PageEmptyProps {
  icon?: LucideIcon;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

/**
 * Friendly empty state with optional CTA button.
 * Use when a page or section has no data to show.
 */
export function PageEmpty({
  icon: Icon = Inbox,
  title = "Nothing here yet",
  description = "Data will appear here once available.",
  actionLabel,
  onAction,
}: PageEmptyProps) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
        <Icon className="h-7 w-7 text-slate-400" />
      </div>
      <p className="mt-4 text-sm font-semibold text-slate-800">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button size="sm" className="mt-5" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export default PageEmpty;
