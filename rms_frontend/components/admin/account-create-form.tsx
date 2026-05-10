"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { branchesApi } from "@/lib/api/branches";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Shield, AtSign, KeyRound, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Role = "hr" | "branch_manager" | "admin";

export function AccountCreateForm() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("hr");
  const [managedBranch, setManagedBranch] = useState<string>("");
  const [info, setInfo] = useState<string>("");

  const { data: branches } = useQuery({
    queryKey: ["branches"],
    queryFn: branchesApi.getBranches,
  });

  const createAccount = useMutation({
    mutationFn: () =>
      branchesApi.createStaffAccount({
        username: username.trim(),
        email: email.trim(),
        password,
        role,
        managed_branch: role === "branch_manager" ? Number(managedBranch) : null,
        hr_branch_ids: role === "hr" ? (branches ?? []).map((b) => b.id) : [],
      }),
    onSuccess: (result) => {
      setInfo(`Successfully initialized ${result.role} identity for ${result.username}`);
      setUsername("");
      setEmail("");
      setPassword("");
      setManagedBranch("");
      setTimeout(() => setInfo(""), 5000);
    },
    onError: () => {
      setInfo("Integrity fault: Unable to initialize identity. Check validation constraints.");
      setTimeout(() => setInfo(""), 5000);
    },
  });

  const canSubmit = useMemo(() => {
    if (!username.trim() || !password) return false;
    if (role === "branch_manager" && !managedBranch) return false;
    return true;
  }, [managedBranch, password, role, username]);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-1.5">
        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Unique Username</Label>
        <div className="relative">
          <UserPlus className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="operator_01"
            className="pl-10 h-11 bg-slate-50 border-none rounded-xl font-bold text-sm"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Secure Email</Label>
        <div className="relative">
          <AtSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="staff@rawstitch.com"
            className="pl-10 h-11 bg-slate-50 border-none rounded-xl font-bold text-sm"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Security Credential</Label>
        <div className="relative">
          <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min 6 characters"
            className="pl-10 h-11 bg-slate-50 border-none rounded-xl font-bold text-sm"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Access Hierarchy</Label>
        <Select value={role} onValueChange={(v: Role) => setRole(v)}>
          <SelectTrigger className="h-11 bg-slate-50 border-none rounded-xl font-bold text-sm text-brand-primary">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-slate-400" />
              <SelectValue placeholder="Select role" />
            </div>
          </SelectTrigger>
          <SelectContent className="rounded-xl border-brand-primary/5">
            <SelectItem value="hr">Human Resources</SelectItem>
            <SelectItem value="branch_manager">Branch Manager</SelectItem>
            <SelectItem value="admin">Administrator</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {role === "branch_manager" && (
        <div className="space-y-1.5 md:col-span-2">
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Node Assignment (Managed Branch)</Label>
          <Select value={managedBranch} onValueChange={setManagedBranch}>
            <SelectTrigger className="h-11 bg-slate-50 border-none rounded-xl font-bold text-sm text-brand-primary">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-slate-400" />
                <SelectValue placeholder="Select branch" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl border-brand-primary/5">
              {branches?.map((branch) => (
                <SelectItem key={branch.id} value={String(branch.id)}>
                  {branch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="md:col-span-2 flex flex-col sm:flex-row items-center gap-4 pt-2">
        <Button
          onClick={() => createAccount.mutate()}
          disabled={!canSubmit || createAccount.isPending}
          className="w-full sm:w-auto h-12 px-8 rounded-xl font-bold bg-brand-primary text-brand-secondary hover:bg-emerald-900 shadow-lg shadow-brand-primary/20 transition-all active:scale-95"
        >
          {createAccount.isPending ? "Hashing & Provisioning..." : "Initialize Identity"}
        </Button>
        {info ? (
          <span className={cn(
            "text-[11px] font-black uppercase tracking-wider",
            info.includes("Integrity fault") ? "text-rose-500" : "text-emerald-600"
          )}>
            {info}
          </span>
        ) : null}
      </div>
    </div>
  );
}
