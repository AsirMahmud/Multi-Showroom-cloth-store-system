"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  KeyRound,
  Pencil,
  Search,
  Shield,
  ShieldCheck,
  ShieldOff,
  UserCog,
  Users2,
  Filter,
  X
} from "lucide-react";

import { accountsApi } from "@/lib/api/accounts";
import { branchesApi } from "@/lib/api/branches";
import type { Account } from "@/types/hr";

import { Button } from "@/components/ui/button";
import { DataPanel } from "@/components/ui/professional";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const ROLE_LABEL: Record<Account["role"], string> = {
  admin: "Admin",
  branch_manager: "Branch Manager",
  hr: "HR",
};

const ROLE_BADGE_CLASS: Record<Account["role"], string> = {
  admin: "bg-amber-100 text-amber-800 border-amber-200",
  branch_manager: "bg-indigo-100 text-indigo-800 border-indigo-200",
  hr: "bg-emerald-100 text-emerald-800 border-emerald-200",
};

export function AccountCenter() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("active");
  const [editing, setEditing] = useState<Account | null>(null);
  const [resetting, setResetting] = useState<Account | null>(null);
  const [confirmDeactivate, setConfirmDeactivate] = useState<Account | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-accounts"],
    queryFn: accountsApi.list,
  });

  const { data: branches } = useQuery({
    queryKey: ["branches"],
    queryFn: branchesApi.getBranches,
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    const needle = search.trim().toLowerCase();
    return data.filter((account) => {
      if (roleFilter !== "all" && account.role !== roleFilter) return false;
      if (statusFilter === "active" && !account.is_active) return false;
      if (statusFilter === "inactive" && account.is_active) return false;
      if (!needle) return true;
      const haystack = [
        account.username,
        account.email,
        account.first_name,
        account.last_name,
        account.managed_branch_name ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [data, search, roleFilter, statusFilter]);

  const deactivateMutation = useMutation({
    mutationFn: (id: number) => accountsApi.deactivate(id),
    onSuccess: (result) => {
      toast({ 
        title: "Account Deactivated",
        description: `Access for ${result.username} has been disabled.`
      });
      qc.invalidateQueries({ queryKey: ["admin-accounts"] });
    },
    onError: (e: any) => {
      toast({
        title: "Deactivation Failed",
        description: e.response?.data?.detail ?? e.message,
        variant: "destructive",
      });
    },
  });

  const activateMutation = useMutation({
    mutationFn: (id: number) => accountsApi.activate(id),
    onSuccess: (result) => {
      toast({ 
        title: "Account Reactivated",
        description: `Access for ${result.username} has been restored.`
      });
      qc.invalidateQueries({ queryKey: ["admin-accounts"] });
    },
    onError: (e: any) => {
      toast({
        title: "Reactivation Failed",
        description: e.response?.data?.detail ?? e.message,
        variant: "destructive",
      });
    }
  });

  const counts = useMemo(() => {
    if (!data) return { total: 0, admins: 0, managers: 0, hr: 0, inactive: 0 };
    return data.reduce(
      (acc, account) => {
        acc.total += 1;
        if (!account.is_active) acc.inactive += 1;
        if (account.role === "admin") acc.admins += 1;
        if (account.role === "branch_manager") acc.managers += 1;
        if (account.role === "hr") acc.hr += 1;
        return acc;
      },
      { total: 0, admins: 0, managers: 0, hr: 0, inactive: 0 }
    );
  }, [data]);

  return (
    <DataPanel
      title="User Accounts"
      description="Manage all user accounts and their permission levels."
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <KpiPill label="Total Accounts" value={counts.total} />
          <KpiPill label="Admins" value={counts.admins} tone="amber" />
          <KpiPill label="Managers" value={counts.managers} tone="indigo" />
          <KpiPill label="HR / Staff" value={counts.hr} tone="emerald" />
          <KpiPill label="Inactive" value={counts.inactive} tone="rose" />
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or email..."
              className="pl-10 h-11 bg-slate-50 border-none rounded-xl font-bold text-sm"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[160px] h-11 bg-slate-50 border-none rounded-xl font-bold text-xs uppercase tracking-widest text-brand-primary">
                <Filter className="h-3.5 w-3.5 mr-2 text-slate-400" />
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-brand-primary/5">
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Administrators</SelectItem>
                <SelectItem value="branch_manager">Branch Managers</SelectItem>
                <SelectItem value="hr">HR / Staff</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px] h-11 bg-slate-50 border-none rounded-xl font-bold text-xs uppercase tracking-widest text-brand-primary">
                <Shield className="h-3.5 w-3.5 mr-2 text-slate-400" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-brand-primary/5">
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="inactive">Inactive Only</SelectItem>
                <SelectItem value="all">Show All</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="overflow-hidden rounded-[24px] border border-brand-primary/5 shadow-sm">
          <Table>
            <TableHeader className="bg-brand-primary">
              <TableRow className="hover:bg-brand-primary border-none">
                <TableHead className="text-brand-secondary font-black text-[10px] uppercase tracking-widest py-4">User</TableHead>
                <TableHead className="text-brand-secondary font-black text-[10px] uppercase tracking-widest py-4">Role</TableHead>
                <TableHead className="text-brand-secondary font-black text-[10px] uppercase tracking-widest py-4">Branch Access</TableHead>
                <TableHead className="text-brand-secondary font-black text-[10px] uppercase tracking-widest py-4">Status</TableHead>
                <TableHead className="text-brand-secondary font-black text-[10px] uppercase tracking-widest py-4 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={5} className="py-8">
                      <Skeleton className="h-10 w-full rounded-xl" />
                    </TableCell>
                  </TableRow>
                ))
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-20 text-center">
                    <p className="text-sm font-black text-rose-500 uppercase tracking-widest">Error Loading Data</p>
                    <p className="text-xs text-slate-400 mt-2">Failed to retrieve the list of user accounts.</p>
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-32 text-center">
                    <Users2 className="mx-auto mb-4 h-12 w-12 text-slate-200" />
                    <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No Users Found</p>
                    <p className="text-xs text-slate-300 mt-2">No users match your search or filter criteria.</p>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((account) => (
                  <TableRow key={account.id} className="group hover:bg-slate-50/50 transition-colors border-brand-primary/5">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-brand-secondary text-brand-primary flex items-center justify-center font-black text-xs shadow-sm">
                          {account.username.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-black text-brand-primary flex items-center gap-1.5">
                            {account.username}
                            {account.is_superuser && (
                              <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none rounded-md px-1.5 h-4 text-[9px] font-black uppercase tracking-tighter">Admin</Badge>
                            )}
                          </p>
                          <p className="text-[10px] font-bold text-slate-400 truncate max-w-[200px]">{account.email || "NO_EMAIL_RECORD"}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={cn(
                          "rounded-lg px-2 py-0.5 text-[10px] font-black uppercase tracking-widest border-none",
                          ROLE_BADGE_CLASS[account.role]
                        )}
                      >
                        {ROLE_LABEL[account.role]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Shield className="h-3.5 w-3.5 text-slate-300" />
                        <p className="text-[11px] font-bold text-slate-600">
                          {account.role === "admin" ? (
                            "Full Access"
                          ) : account.role === "branch_manager" ? (
                            account.managed_branch_name || "Unassigned"
                          ) : account.hr_branch_names.length > 0 ? (
                            account.hr_branch_names.join(", ")
                          ) : (
                            "General Access"
                          )}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {account.is_active ? (
                        <div className="flex items-center gap-1.5 text-emerald-600">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Active</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-rose-500">
                          <ShieldOff className="h-3.5 w-3.5" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Inactive</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg text-slate-400 hover:text-brand-primary hover:bg-brand-secondary/50"
                          onClick={() => setEditing(account)}
                          title="Edit User"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg text-slate-400 hover:text-brand-primary hover:bg-brand-secondary/50"
                          onClick={() => setResetting(account)}
                          title="Change Password"
                        >
                          <KeyRound className="h-3.5 w-3.5" />
                        </Button>
                        {account.is_active ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50"
                            onClick={() => setConfirmDeactivate(account)}
                            title="Deactivate Account"
                          >
                            <ShieldOff className="h-3.5 w-3.5" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50"
                            onClick={() => activateMutation.mutate(account.id)}
                            title="Activate Account"
                          >
                            <ShieldCheck className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <EditAccountDialog
        account={editing}
        branches={branches ?? []}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          qc.invalidateQueries({ queryKey: ["admin-accounts"] });
        }}
      />

      <ResetPasswordDialog
        account={resetting}
        onClose={() => setResetting(null)}
      />

      <AlertDialog
        open={!!confirmDeactivate}
        onOpenChange={(open) => !open && setConfirmDeactivate(null)}
      >
        <AlertDialogContent className="rounded-[32px] border-none p-8">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black text-brand-primary tracking-tight">Deactivate Account?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-slate-500 font-medium">
              User: <span className="font-black text-brand-primary">{confirmDeactivate?.username}</span>. 
              Deactivating this account will immediately disable access for this user.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3">
            <AlertDialogCancel className="h-12 rounded-xl font-bold border-none bg-slate-50">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="h-12 rounded-xl font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/20"
              onClick={() => {
                if (confirmDeactivate) {
                  deactivateMutation.mutate(confirmDeactivate.id);
                }
                setConfirmDeactivate(null);
              }}
            >
              Confirm Deactivation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DataPanel>
  );
}

function KpiPill({
  label,
  value,
  tone = "slate",
}: {
  label: string;
  value: number;
  tone?: "slate" | "amber" | "indigo" | "emerald" | "rose";
}) {
  const TONES: Record<string, string> = {
    slate: "bg-slate-100/50 text-slate-500 border-slate-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    rose: "bg-rose-50 text-rose-500 border-rose-100",
  };
  return (
    <div className={cn("inline-flex items-center gap-2 rounded-xl px-3 py-1.5 border transition-all", TONES[tone])}>
      <span className="text-[10px] font-black uppercase tracking-widest opacity-70">{label}</span>
      <span className="text-xs font-black">{value}</span>
    </div>
  );
}

function EditAccountDialog({
  account,
  branches,
  onClose,
  onSaved,
}: {
  account: Account | null;
  branches: { id: number; name: string }[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState<Account["role"]>("hr");
  const [managedBranch, setManagedBranch] = useState<string>("");

  useMemo(() => {
    if (account) {
      setEmail(account.email ?? "");
      setFirstName(account.first_name ?? "");
      setLastName(account.last_name ?? "");
      setRole(account.role);
      setManagedBranch(account.managed_branch ? String(account.managed_branch) : "");
    }
  }, [account]);

  const save = useMutation({
    mutationFn: () =>
      accountsApi.update(account!.id, {
        email,
        first_name: firstName,
        last_name: lastName,
        role,
        managed_branch:
          role === "branch_manager" && managedBranch ? Number(managedBranch) : null,
      }),
    onSuccess: (result) => {
      toast({ 
        title: "Account Updated",
        description: `Profile for ${result.username} has been successfully updated.`
      });
      onSaved();
    },
    onError: (e: any) => {
      const errorData = e.response?.data;
      let errorMessage = "Synchronization fault: Unable to update identity.";
      
      if (errorData) {
        if (typeof errorData === 'object') {
          errorMessage = Object.entries(errorData)
            .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : value}`)
            .join(" | ");
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        }
      }

      toast({
        title: "Update Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog
      open={!!account}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent className="sm:max-w-lg rounded-[32px] border-none p-8">
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-brand-primary tracking-tight uppercase">Edit User Account</DialogTitle>
          <DialogDescription className="text-sm text-slate-400 font-medium">
            Changing permissions for: <span className="font-bold text-brand-primary">{account?.username}</span>
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 sm:grid-cols-2 pt-4">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">First Name</Label>
            <Input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="h-11 bg-slate-50 border-none rounded-xl font-bold text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Last Name</Label>
            <Input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="h-11 bg-slate-50 border-none rounded-xl font-bold text-sm"
            />
          </div>
          <div className="sm:col-span-2 space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Email Address</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 bg-slate-50 border-none rounded-xl font-bold text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">User Role</Label>
            <Select
              value={role}
              onValueChange={(v: Account["role"]) => setRole(v)}
            >
              <SelectTrigger className="h-11 bg-slate-50 border-none rounded-xl font-bold text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-brand-primary/5">
                <SelectItem value="admin">Administrator</SelectItem>
                <SelectItem value="branch_manager">Branch Manager</SelectItem>
                <SelectItem value="hr">Human Resources</SelectItem>
              </SelectContent>
            </Select>
          </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Assign to Branch</Label>
              <Select value={managedBranch} onValueChange={setManagedBranch}>
                <SelectTrigger className="h-11 bg-slate-50 border-none rounded-xl font-bold text-sm">
                  <SelectValue placeholder="Select branch..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-brand-primary/5">
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={String(b.id)}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter className="gap-3 pt-4">
          <Button variant="ghost" className="h-12 rounded-xl font-bold text-slate-400" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="h-12 rounded-xl font-bold bg-brand-primary text-brand-secondary hover:bg-emerald-900 shadow-lg shadow-brand-primary/20 px-8"
            onClick={() => save.mutate()}
            disabled={save.isPending || (role === "branch_manager" && !managedBranch)}
          >
            {save.isPending ? "Updating..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ResetPasswordDialog({
  account,
  onClose,
}: {
  account: Account | null;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");

  const reset = useMutation({
    mutationFn: () => accountsApi.resetPassword(account!.id, pw),
    onSuccess: () => {
      toast({ 
        title: "Password Changed",
        description: "The user's password has been successfully updated."
      });
      setPw("");
      setPw2("");
      onClose();
    },
    onError: (e: any) => {
      toast({
        title: "Reset Failed",
        description: e.response?.data?.detail ?? e.message,
        variant: "destructive",
      });
    },
  });

  const valid = pw.length >= 6 && pw === pw2;

  return (
    <Dialog
      open={!!account}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent className="sm:max-w-md rounded-[32px] border-none p-8">
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-brand-primary tracking-tight uppercase">Change Password</DialogTitle>
          <DialogDescription className="text-sm text-slate-400 font-medium">
            Set a new password for: <span className="font-bold text-brand-primary">{account?.username}</span>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5 pt-4">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">New Password</Label>
            <Input
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="Minimum 6 characters"
              className="h-11 bg-slate-50 border-none rounded-xl font-bold text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Confirm Password</Label>
            <Input
              type="password"
              value={pw2}
              onChange={(e) => setPw2(e.target.value)}
              className="h-11 bg-slate-50 border-none rounded-xl font-bold text-sm"
            />
            {pw && pw2 && pw !== pw2 ? (
              <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mt-1 ml-1">Passwords do not match</p>
            ) : null}
          </div>
        </div>
        <DialogFooter className="gap-3 pt-6">
          <Button variant="ghost" className="h-12 rounded-xl font-bold text-slate-400" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            className="h-12 rounded-xl font-bold bg-brand-primary text-brand-secondary hover:bg-emerald-900 shadow-lg shadow-brand-primary/20 px-8"
            onClick={() => reset.mutate()} 
            disabled={!valid || reset.isPending}
          >
            {reset.isPending ? "Updating..." : "Save Password"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
