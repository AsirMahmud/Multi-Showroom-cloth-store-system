"use client";

import { useMemo, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Search, Sparkles, X } from "lucide-react";

import { useBranch } from "@/contexts/branch-context";
import { useAuth } from "@/contexts/auth-context";
import {
  Dialog,
  DialogOverlay,
  DialogPortal,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { BranchCard } from "@/components/branch/branch-card";

export function BranchSelectorModal() {
  const { user } = useAuth();
  const {
    selectorOpen,
    selectionMade,
    selectedBranchId,
    availableBranches,
    availableBranchIds,
    branchesLoading,
    setSelectedBranchId,
    closeBranchSelector,
  } = useBranch();
  const [query, setQuery] = useState("");

  const isAdmin = user?.role === "admin";
  const visibleBranches = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = availableBranches;
    // Non-admins only see branches they can access.
    if (!isAdmin && availableBranchIds.length > 0) {
      list = list.filter((b) => availableBranchIds.includes(b.id));
    }
    if (!q) return list;
    return list.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        (b.address ?? "").toLowerCase().includes(q)
    );
  }, [availableBranches, availableBranchIds, isAdmin, query]);

  const handlePick = (branchId: number | null) => {
    setSelectedBranchId(branchId);
    closeBranchSelector();
  };

  // We never render anything if the user isn't logged in.
  if (!user) return null;

  return (
    <Dialog
      open={selectorOpen}
      onOpenChange={(open) => {
        if (!open) closeBranchSelector();
      }}
    >
      <DialogPortal>
        <DialogOverlay className="bg-black/40 backdrop-blur-[2px]" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          onEscapeKeyDown={(e) => {
            if (!selectionMade && !isAdmin) e.preventDefault();
          }}
          onPointerDownOutside={(e) => {
            if (!selectionMade && !isAdmin) e.preventDefault();
          }}
          onInteractOutside={(e) => {
            if (!selectionMade && !isAdmin) e.preventDefault();
          }}
          className={cn(
            "fixed left-1/2 top-1/2 z-50 flex flex-col w-[95vw] max-w-6xl -translate-x-1/2 -translate-y-1/2",
            "max-h-[85vh] min-h-[500px] overflow-hidden rounded-[40px] border-none bg-white shadow-[0_32px_64px_-12px_rgba(22,54,37,0.15)]",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          )}
        >
          {/* Header Section */}
          <div className="relative shrink-0 overflow-hidden bg-white border-b border-slate-50 px-10 py-10">
            {/* Decorative background elements */}
            <div className="absolute right-0 top-0 -translate-y-1/4 translate-x-1/4 opacity-30">
              <div className="h-64 w-64 rounded-full bg-brand-secondary blur-[100px]" />
            </div>
            <div className="absolute left-0 bottom-0 translate-y-1/4 -translate-x-1/4 opacity-20">
              <div className="h-48 w-48 rounded-full bg-brand-secondary blur-[80px]" />
            </div>

            <div className="relative flex flex-col md:flex-row md:items-start justify-between gap-6">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-brand-secondary/50 text-brand-primary text-[9px] font-black uppercase tracking-widest mb-1">
                  <Sparkles className="h-2.5 w-2.5" />
                  System Workspace
                </div>
                <DialogPrimitive.Title className="text-2xl font-black tracking-tight text-brand-primary leading-tight">
                  {selectionMade ? "Switch Environment" : "Select Your Workspace"}
                </DialogPrimitive.Title>
                <p className="text-slate-400 text-sm max-w-lg font-medium">
                  {selectionMade
                    ? "Seamlessly transition between branches to manage localized data."
                    : `Welcome back, ${user.username}. Select a branch to begin.`}
                </p>
              </div>
              
              {(selectionMade || isAdmin) && (
                <DialogPrimitive.Close
                  className="rounded-xl p-2 text-slate-300 hover:bg-slate-50 hover:text-brand-primary transition-all border border-slate-100"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </DialogPrimitive.Close>
              )}
            </div>

            <div className="relative mt-6 max-w-xl">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-300" />
              </div>
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search branches..."
                className="pl-11 h-11 bg-slate-50 border-slate-100 text-brand-primary placeholder:text-slate-300 focus-visible:ring-brand-primary/10 focus-visible:bg-white focus-visible:border-brand-primary/20 transition-all rounded-xl text-sm font-medium"
              />
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-6 bg-slate-100/80 dark:bg-slate-950 scrollbar-none hover:scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
            {/* All Branches pinned card - admin only */}
            {isAdmin && (
              <div className="mb-6 px-2">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 flex-shrink-0">
                    Administrative Access
                  </span>
                  <div className="h-px flex-1 bg-slate-200" />
                </div>
                <BranchCard
                  variant="all"
                  branchId={null}
                  name="Global Dashboard (All Branches)"
                  selected={selectionMade && selectedBranchId === null}
                  onSelect={() => handlePick(null)}
                />
              </div>
            )}

            <div className="flex items-center gap-3 mb-4 px-2">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 flex-shrink-0">
                {isAdmin ? "Organizational Branches" : "Your Workspaces"}
              </span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            {branchesLoading && availableBranches.length === 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-[210px] rounded-2xl" />
                ))}
              </div>
            ) : visibleBranches.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-100 bg-white p-16 text-center shadow-sm">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-300 mb-4">
                  <Search className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">No branches found</h3>
                <p className="mt-2 text-sm text-slate-500 max-w-[280px]">
                  {query
                    ? `We couldn't find any results for "${query}". Try checking for typos or use different keywords.`
                    : "You don't have access to any branches yet. Please contact your system administrator."}
                </p>
                {query && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuery("")}
                    className="mt-6 border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg px-6"
                  >
                    Clear search query
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 px-2 pb-6">
                {visibleBranches.map((branch) => (
                  <BranchCard
                    key={branch.id}
                    variant="branch"
                    branchId={branch.id}
                    name={branch.name}
                    address={branch.address}
                    selected={selectedBranchId === branch.id && selectionMade}
                    onSelect={() => handlePick(branch.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}

export default BranchSelectorModal;
