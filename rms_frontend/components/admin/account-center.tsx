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
} from "lucide-react";

import { accountsApi } from "@/lib/api/accounts";
import { branchesApi } from "@/lib/api/branches";
import type { Account } from "@/types/hr";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    onSuccess: () => {
      toast({ title: "Account deactivated" });
      qc.invalidateQueries({ queryKey: ["admin-accounts"] });
    },
    onError: (e: Error & { response?: { data?: { detail?: string } } }) => {
      toast({
        title: "Could not deactivate",
        description: e.response?.data?.detail ?? e.message,
        variant: "destructive",
      });
    },
  });

  const activateMutation = useMutation({
    mutationFn: (id: number) => accountsApi.activate(id),
    onSuccess: () => {
      toast({ title: "Account reactivated" });
      qc.invalidateQueries({ queryKey: ["admin-accounts"] });
    },
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
    <Card className="border border-slate-200/80 shadow-sm">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <UserCog className="h-5 w-5 text-slate-700" />
              Account Center
            </CardTitle>
            <CardDescription>
              Manage staff accounts: edit, deactivate, or reset passwords. Admin
              only.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <KpiPill label="Total" value={counts.total} />
            <KpiPill label="Admins" value={counts.admins} tone="amber" />
            <KpiPill label="Managers" value={counts.managers} tone="indigo" />
            <KpiPill label="HR" value={counts.hr} tone="emerald" />
            <KpiPill label="Inactive" value={counts.inactive} tone="rose" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, branch..."
              className="pl-8"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              <SelectItem value="admin">Admins</SelectItem>
              <SelectItem value="branch_manager">Branch Managers</SelectItem>
              <SelectItem value="hr">HR</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active only</SelectItem>
              <SelectItem value="inactive">Inactive only</SelectItem>
              <SelectItem value="all">All statuses</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-hidden rounded-lg border border-slate-200">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80">
                <TableHead>Account</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Branch access</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last login</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6}>
                      <Skeleton className="h-10 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-sm text-rose-600">
                    Failed to load accounts. Please retry.
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-sm text-slate-500">
                    <Users2 className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                    No accounts match your filters.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((account) => (
                  <TableRow key={account.id} className="hover:bg-slate-50/60">
                    <TableCell>
                      <div className="font-medium text-slate-900">
                        {account.username}
                        {account.is_superuser ? (
                          <Shield className="ml-1 inline h-3.5 w-3.5 text-amber-500" />
                        ) : null}
                      </div>
                      <div className="text-xs text-slate-500">
                        {account.email || "—"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={ROLE_BADGE_CLASS[account.role]}
                      >
                        {ROLE_LABEL[account.role]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">
                      {account.role === "admin" ? (
                        "All branches"
                      ) : account.role === "branch_manager" ? (
                        account.managed_branch_name || "—"
                      ) : account.hr_branch_names.length > 0 ? (
                        account.hr_branch_names.join(", ")
                      ) : (
                        "All branches"
                      )}
                    </TableCell>
                    <TableCell>
                      {account.is_active ? (
                        <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                          <ShieldCheck className="mr-1 h-3 w-3" /> Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-700">
                          <ShieldOff className="mr-1 h-3 w-3" /> Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">
                      {account.last_login
                        ? new Date(account.last_login).toLocaleString()
                        : "Never"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditing(account)}
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setResetting(account)}
                          title="Reset password"
                        >
                          <KeyRound className="h-4 w-4" />
                        </Button>
                        {account.is_active ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setConfirmDeactivate(account)}
                            className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                            title="Deactivate"
                          >
                            <ShieldOff className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => activateMutation.mutate(account.id)}
                            className="text-emerald-700 hover:bg-emerald-50"
                            title="Reactivate"
                          >
                            <ShieldCheck className="h-4 w-4" />
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
      </CardContent>

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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate this account?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDeactivate?.username} will lose access immediately. You
              can reactivate them later from the same page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-600 hover:bg-rose-700"
              onClick={() => {
                if (confirmDeactivate) {
                  deactivateMutation.mutate(confirmDeactivate.id);
                }
                setConfirmDeactivate(null);
              }}
            >
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
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
    slate: "bg-slate-100 text-slate-700",
    amber: "bg-amber-100 text-amber-800",
    indigo: "bg-indigo-100 text-indigo-800",
    emerald: "bg-emerald-100 text-emerald-800",
    rose: "bg-rose-100 text-rose-700",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-medium ${TONES[tone]}`}>
      <span className="text-[11px] uppercase tracking-wider opacity-80">{label}</span>
      <span className="text-sm">{value}</span>
    </span>
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
  const [email, setEmail] = useState(account?.email ?? "");
  const [firstName, setFirstName] = useState(account?.first_name ?? "");
  const [lastName, setLastName] = useState(account?.last_name ?? "");
  const [role, setRole] = useState<Account["role"]>(account?.role ?? "hr");
  const [managedBranch, setManagedBranch] = useState<string>(
    account?.managed_branch ? String(account.managed_branch) : ""
  );

  // When the dialog reopens with a different account, reset the form.
  if (account && account.email !== email && email === "" && firstName === "") {
    setEmail(account.email ?? "");
    setFirstName(account.first_name ?? "");
    setLastName(account.last_name ?? "");
    setRole(account.role);
    setManagedBranch(account.managed_branch ? String(account.managed_branch) : "");
  }

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
    onSuccess: () => {
      toast({ title: "Account updated" });
      onSaved();
    },
    onError: (e: Error & { response?: { data?: Record<string, string[]> } }) => {
      toast({
        title: "Update failed",
        description:
          Object.values(e.response?.data ?? {}).flat().join(" ") || e.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog
      open={!!account}
      onOpenChange={(open) => {
        if (!open) {
          setEmail("");
          setFirstName("");
          setLastName("");
          setManagedBranch("");
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit account</DialogTitle>
          <DialogDescription>
            {account?.username} — admin-only change.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="edit-first">First name</Label>
            <Input
              id="edit-first"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-last">Last name</Label>
            <Input
              id="edit-last"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
          <div className="sm:col-span-2 space-y-1.5">
            <Label htmlFor="edit-email">Email</Label>
            <Input
              id="edit-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select
              value={role}
              onValueChange={(v: Account["role"]) => setRole(v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="branch_manager">Branch Manager</SelectItem>
                <SelectItem value="hr">HR</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {role === "branch_manager" && (
            <div className="space-y-1.5">
              <Label>Managed branch</Label>
              <Select value={managedBranch} onValueChange={setManagedBranch}>
                <SelectTrigger>
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent>
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
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => save.mutate()}
            disabled={save.isPending || (role === "branch_manager" && !managedBranch)}
          >
            {save.isPending ? "Saving..." : "Save changes"}
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
      toast({ title: "Password updated" });
      setPw("");
      setPw2("");
      onClose();
    },
    onError: (e: Error & { response?: { data?: Record<string, string[]> } }) =>
      toast({
        title: "Reset failed",
        description:
          Object.values(e.response?.data ?? {}).flat().join(" ") || e.message,
        variant: "destructive",
      }),
  });

  const valid = pw.length >= 6 && pw === pw2;

  return (
    <Dialog
      open={!!account}
      onOpenChange={(open) => {
        if (!open) {
          setPw("");
          setPw2("");
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reset password</DialogTitle>
          <DialogDescription>
            Set a new password for {account?.username}. Share it with them
            securely.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="rp-1">New password</Label>
            <Input
              id="rp-1"
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="Min 6 characters"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rp-2">Confirm password</Label>
            <Input
              id="rp-2"
              type="password"
              value={pw2}
              onChange={(e) => setPw2(e.target.value)}
            />
            {pw && pw2 && pw !== pw2 ? (
              <p className="text-xs text-rose-600">Passwords don&apos;t match.</p>
            ) : null}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => reset.mutate()} disabled={!valid || reset.isPending}>
            {reset.isPending ? "Saving..." : "Update password"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
