"use client";

import { Store, LayoutGrid, Repeat } from "lucide-react";

import { useBranch } from "@/contexts/branch-context";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ViewingBranchRibbon({ className }: { className?: string }) {
  const { user } = useAuth();
  const {
    selectedBranchId,
    selectionMade,
    availableBranches,
    openBranchSelector,
  } = useBranch();

  if (!user) return null;
  if (!selectionMade) return null;

  const isAll = selectedBranchId === null;
  const branch = availableBranches.find((b) => b.id === selectedBranchId);
  const Icon = isAll ? LayoutGrid : Store;
  const label = isAll
    ? "All Branches"
    : branch?.name ?? `Branch #${selectedBranchId ?? "—"}`;
  const canSwitch = user.role === "admin" || (user.branchIds?.length ?? 0) > 1;

  return (
    <div
      className={cn(
        "sticky top-0 z-30 w-full",
        "bg-white/60 backdrop-blur-xl",
        "border-b border-brand-primary/5",
        className
      )}
    >
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 md:px-8">
        <div className="flex items-center gap-4 min-w-0">
          <span
            className={cn(
              "inline-flex h-8 w-8 items-center justify-center rounded-xl shadow-lg",
              isAll
                ? "bg-brand-primary text-brand-secondary"
                : "bg-brand-secondary text-brand-primary"
            )}
          >
            <Icon className="h-4 w-4" />
          </span>
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[10px] uppercase tracking-widest font-black text-slate-300">
              Environment:
            </span>
            <span className="text-sm font-black text-brand-primary truncate">
              {label}
            </span>
          </div>
        </div>

        {canSwitch && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 px-4 gap-2 text-brand-primary hover:text-emerald-700 hover:bg-brand-secondary/50 rounded-xl transition-all border border-brand-primary/5 font-black text-[10px] uppercase tracking-widest"
            onClick={openBranchSelector}
          >
            <Repeat className="h-3.5 w-3.5" />
            Switch Workspace
          </Button>
        )}
      </div>
    </div>
  );
}

export default ViewingBranchRibbon;
