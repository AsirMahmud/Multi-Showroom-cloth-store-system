"use client";

import {
  Building2,
  ChevronsUpDown,
  Globe2,
  LogOut,
  User as UserIcon,
} from "lucide-react";

import { useBranch } from "@/contexts/branch-context";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { NotificationsDrawer } from "@/components/notifications/notifications-drawer";

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrator",
  branch_manager: "Branch Manager",
  hr: "HR Manager",
};

export function UpperNav() {
  const { user, logout } = useAuth();
  const {
    selectedBranchId,
    selectionMade,
    availableBranches,
    openBranchSelector,
  } = useBranch();

  const isAll = selectedBranchId === null;
  const branch = availableBranches.find((b) => b.id === selectedBranchId);
  const branchLabel = isAll
    ? "All Branches"
    : branch?.name ?? (selectedBranchId ? `Branch #${selectedBranchId}` : "—");
  const Icon = isAll ? Globe2 : Building2;
  const canSwitch =
    user?.role === "admin" || (user?.branchIds?.length ?? 0) > 1;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-brand-primary/5 bg-white/60 backdrop-blur-xl pl-16 pr-4 md:px-6 py-4">
      <div className="flex items-center justify-between gap-6">
        <div className="flex items-center gap-4 min-w-0">
          <div className="min-w-0">
            <div className="hidden md:block text-[10px] uppercase tracking-widest font-bold text-brand-primary/40 leading-none mb-1">
              Retail Management System
            </div>
            <div className="text-xl font-bold bg-gradient-to-r from-brand-primary to-emerald-800 bg-clip-text text-transparent truncate">
              {user ? `Hello, ${user.username}` : "Hello"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Branch badge / switcher */}
          {user && selectionMade && (
            <Button
              variant="ghost"
              onClick={openBranchSelector}
              disabled={!canSwitch}
              className={cn(
                "hidden md:flex h-11 gap-3 pl-2 pr-4 bg-brand-primary/5 hover:bg-brand-primary/10 border border-brand-primary/5 rounded-2xl transition-all",
                !canSwitch && "opacity-90 cursor-default"
              )}
            >
              <span
                className={cn(
                  "inline-flex h-8 w-8 items-center justify-center rounded-xl text-brand-secondary shadow-lg shadow-brand-primary/20",
                  isAll
                    ? "bg-brand-primary"
                    : "bg-emerald-600"
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              <div className="flex flex-col items-start leading-tight">
                <span className="text-[10px] uppercase tracking-widest text-brand-primary/40 font-bold">
                  Branch
                </span>
                <span className="text-sm font-bold text-brand-primary truncate max-w-[160px]">
                  {branchLabel}
                </span>
              </div>
              {canSwitch && (
                <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground ml-1" />
              )}
            </Button>
          )}

          {/* Notifications bell */}
          {user && <NotificationsDrawer />}

          {/* User menu */}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-11 gap-3 pl-1.5 pr-3 hover:bg-brand-primary/5 rounded-2xl transition-all border border-transparent hover:border-brand-primary/5"
                >
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-brand-primary text-brand-secondary text-xs font-bold shadow-lg shadow-brand-primary/20">
                    {user.username.slice(0, 2).toUpperCase()}
                  </span>
                  <div className="hidden md:flex flex-col items-start leading-tight">
                    <span className="text-sm font-bold text-brand-primary">
                      {user.username}
                    </span>
                    <span className="text-[10px] uppercase tracking-widest text-brand-primary/40 font-bold">
                      {ROLE_LABELS[user.role] ?? user.role}
                    </span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="text-sm font-semibold">{user.username}</div>
                  <div className="text-xs text-muted-foreground font-normal">
                    {ROLE_LABELS[user.role] ?? user.role}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {canSwitch && (
                  <DropdownMenuItem onClick={openBranchSelector}>
                    <Building2 className="h-4 w-4 mr-2" />
                    Switch branch
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem disabled>
                  <UserIcon className="h-4 w-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => logout()}
                  className="text-rose-600 focus:text-rose-700"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
