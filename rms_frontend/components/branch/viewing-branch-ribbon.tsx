"use client";

import { Building2, Globe2, Repeat } from "lucide-react";

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
  const Icon = isAll ? Globe2 : Building2;
  const label = isAll
    ? "All Branches"
    : branch?.name ?? `Branch #${selectedBranchId ?? "—"}`;
  const canSwitch = user.role === "admin" || (user.branchIds?.length ?? 0) > 1;

  return (
    <div
      className={cn(
        "sticky top-0 z-30 w-full",
        "bg-gradient-to-r from-indigo-50 via-white to-violet-50",
        "border-b border-indigo-100",
        className
      )}
    >
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 md:px-6">
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className={cn(
              "inline-flex h-7 w-7 items-center justify-center rounded-full",
              isAll
                ? "bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white"
                : "bg-gradient-to-br from-sky-500 to-indigo-600 text-white"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
          </span>
          <div className="min-w-0">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-indigo-500/80">
              Viewing
            </span>
            <span className="ml-2 text-sm font-semibold text-slate-800 truncate">
              {label}
            </span>
          </div>
        </div>

        {canSwitch && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-100/60"
            onClick={openBranchSelector}
          >
            <Repeat className="h-3.5 w-3.5" />
            <span className="text-xs font-semibold">Switch</span>
          </Button>
        )}
      </div>
    </div>
  );
}

export default ViewingBranchRibbon;
