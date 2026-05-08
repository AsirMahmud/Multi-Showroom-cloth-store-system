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
    <header className="w-full bg-white border-b border-slate-200/80 px-4 md:px-6 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
            Retail Management System
          </div>
          <div className="text-base md:text-lg font-semibold text-slate-800 truncate">
            {user ? `Welcome, ${user.username}` : "Welcome"}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Branch badge / switcher */}
          {user && selectionMade && (
            <Button
              variant="outline"
              onClick={openBranchSelector}
              disabled={!canSwitch}
              className={cn(
                "h-10 gap-2 pl-2 pr-3 border-slate-200 bg-slate-50 hover:bg-slate-100",
                !canSwitch && "opacity-90 cursor-default"
              )}
            >
              <span
                className={cn(
                  "inline-flex h-7 w-7 items-center justify-center rounded-md text-[#E4FCD5]",
                  isAll
                    ? "bg-gradient-to-br from-[#163625] to-[#2a5d45]"
                    : "bg-gradient-to-br from-[#163625] via-[#1a4d35] to-[#163625]"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
              </span>
              <div className="flex flex-col items-start leading-tight">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                  Branch
                </span>
                <span className="text-sm font-semibold text-slate-800 truncate max-w-[160px]">
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
                  className="h-10 gap-2 pl-1.5 pr-2.5 hover:bg-slate-100"
                >
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-white text-xs font-semibold">
                    {user.username.slice(0, 2).toUpperCase()}
                  </span>
                  <div className="hidden md:flex flex-col items-start leading-tight">
                    <span className="text-sm font-semibold text-slate-800">
                      {user.username}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
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
