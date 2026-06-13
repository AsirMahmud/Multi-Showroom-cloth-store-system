"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ShieldCheck, Sparkles, UserCheck, Search, Filter } from "lucide-react";

import { DataPanel } from "@/components/ui/professional";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";

import { accountsApi } from "@/lib/api/accounts";
import { permissionsApi, type PermissionCatalogItem } from "@/lib/api/permissions";
import type { Account } from "@/types/hr";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const CATEGORY_TITLE: Record<PermissionCatalogItem["category"], string> = {
  global: "Global Features",
  branch: "Branch Operations",
  system: "System Admin",
};

const ROLE_LABEL: Record<string, string> = {
  admin: "Administrator",
  branch_manager: "Branch Manager",
  hr: "HR / Staff",
};

export function RolesAndPermissions() {
  return (
    <Tabs defaultValue="grants" className="space-y-8">
      <TabsList className="bg-white/50 backdrop-blur-xl border border-brand-primary/5 shadow-premium rounded-2xl p-1 h-auto overflow-x-auto no-scrollbar w-full sm:w-auto">
        <TabsTrigger 
          value="grants"
          className={cn(
            "flex-1 sm:min-w-[180px] py-2.5 rounded-xl transition-all duration-300 font-bold text-[10px] uppercase tracking-widest whitespace-nowrap",
            "data-[state=active]:bg-brand-primary data-[state=active]:text-brand-secondary data-[state=active]:shadow-lg data-[state=active]:shadow-brand-primary/20",
            "text-slate-400 hover:text-slate-600"
          )}
        >
          <UserCheck className="mr-2 h-3.5 w-3.5" /> User Permissions
        </TabsTrigger>
        <TabsTrigger 
          value="cheatsheet"
          className={cn(
            "flex-1 sm:min-w-[180px] py-2.5 rounded-xl transition-all duration-300 font-bold text-[10px] uppercase tracking-widest whitespace-nowrap",
            "data-[state=active]:bg-brand-primary data-[state=active]:text-brand-secondary data-[state=active]:shadow-lg data-[state=active]:shadow-brand-primary/20",
            "text-slate-400 hover:text-slate-600"
          )}
        >
          <Sparkles className="mr-2 h-3.5 w-3.5" /> Role Overview
        </TabsTrigger>
      </TabsList>
      <TabsContent value="grants" className="focus-visible:outline-none">
        <PerUserGrants />
      </TabsContent>
      <TabsContent value="cheatsheet" className="focus-visible:outline-none">
        <RoleCheatsheet />
      </TabsContent>
    </Tabs>
  );
}

function PerUserGrants() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  const { data: accounts, isLoading: accountsLoading } = useQuery({
    queryKey: ["admin-accounts-for-roles"],
    queryFn: accountsApi.list,
  });

  const { data: catalog } = useQuery({
    queryKey: ["permissions-catalog"],
    queryFn: permissionsApi.catalog,
  });

  const { data: userPerms, isLoading: userPermsLoading } = useQuery({
    queryKey: ["user-permissions", selectedUserId],
    queryFn: () => permissionsApi.forUser(selectedUserId as number),
    enabled: !!selectedUserId,
  });

  const setGrants = useMutation({
    mutationFn: (codes: string[]) =>
      permissionsApi.setForUser(selectedUserId as number, codes),
    onSuccess: () => {
      toast({ title: "Permissions updated" });
      qc.invalidateQueries({ queryKey: ["user-permissions", selectedUserId] });
    },
    onError: (e: Error) =>
      toast({
        title: "Update failed",
        description: e.message,
        variant: "destructive",
      }),
  });

  const groupedCatalog = useMemo(() => {
    const groups: Record<string, PermissionCatalogItem[]> = {
      global: [],
      branch: [],
      system: [],
    };
    (catalog ?? []).forEach((p) => {
      groups[p.category].push(p);
    });
    return groups;
  }, [catalog]);

  const selectedAccount = useMemo<Account | undefined>(() => {
    return (accounts ?? []).find((a) => a.id === selectedUserId);
  }, [accounts, selectedUserId]);

  const grantedSet = useMemo(
    () => new Set(userPerms?.granted_codes ?? []),
    [userPerms]
  );
  const defaultSet = useMemo(
    () => new Set(userPerms?.default_codes ?? []),
    [userPerms]
  );

  const togglePermission = (code: string, next: boolean) => {
    if (!userPerms) return;
    const newSet = new Set(grantedSet);
    if (next) newSet.add(code);
    else newSet.delete(code);
    setGrants.mutate(Array.from(newSet));
  };

  return (
    <DataPanel
      title="User Permissions"
      description="Customize and override permissions for individual users."
    >
      <div className="space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="md:w-96">
            <Select
              value={selectedUserId ? String(selectedUserId) : ""}
              onValueChange={(v) => setSelectedUserId(Number(v))}
            >
              <SelectTrigger className="h-11 bg-slate-50 border-none rounded-xl font-bold text-sm text-brand-primary">
                <div className="flex items-center gap-2">
                  <Search className="h-3.5 w-3.5 text-slate-400" />
                  <SelectValue placeholder="Select User" />
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-xl border-brand-primary/5">
                {accountsLoading ? (
                  <SelectItem value="loading" disabled>
                    Loading User Directory...
                  </SelectItem>
                ) : (
                  (accounts ?? []).map((u) => (
                    <SelectItem key={u.id} value={String(u.id)}>
                      {u.username} — {ROLE_LABEL[u.role] ?? u.role}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          {selectedAccount ? (
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-slate-50 text-slate-500 border-slate-100 rounded-lg px-2 py-0.5 text-[10px] font-black uppercase tracking-widest">
                Role: {ROLE_LABEL[selectedAccount.role] ?? selectedAccount.role}
              </Badge>
              {selectedAccount.managed_branch_name && (
                <Badge className="bg-indigo-50 text-indigo-600 border-indigo-100 rounded-lg px-2 py-0.5 text-[10px] font-black uppercase tracking-widest">
                  Branch: {selectedAccount.managed_branch_name}
                </Badge>
              )}
              {selectedAccount.role === "admin" ? (
                <Badge className="bg-amber-100 text-amber-800 border-none rounded-lg px-2 py-0.5 text-[10px] font-black uppercase tracking-widest shadow-sm shadow-amber-500/20">
                  ADMIN_FULL_ACCESS
                </Badge>
              ) : null}
            </div>
          ) : null}
        </div>

        {!selectedUserId ? (
          <EmptyState message="Select a user from the selector above to manage permissions." />
        ) : userPermsLoading ? (
          <div className="grid gap-6 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-3xl" />
            ))}
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            {(["global", "branch", "system"] as const).map((cat) => (
              <div
                key={cat}
                className="bg-slate-50/50 rounded-3xl p-6 border border-slate-100/50"
              >
                <div className="mb-6 flex items-center justify-between">
                  <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                    {CATEGORY_TITLE[cat]}
                  </h4>
                  <div className="h-1.5 w-1.5 rounded-full bg-brand-primary opacity-20" />
                </div>
                <div className="space-y-4">
                  {groupedCatalog[cat].map((p) => {
                    const isDefault = defaultSet.has(p.code);
                    const isGranted = grantedSet.has(p.code);
                    const checked =
                      isDefault || isGranted || selectedAccount?.role === "admin";
                    const disabled =
                      isDefault ||
                      selectedAccount?.role === "admin" ||
                      setGrants.isPending;
                    return (
                      <div
                        key={p.code}
                        className="group flex items-start gap-4 p-4 bg-white rounded-2xl border border-transparent hover:border-brand-primary/5 hover:shadow-xl hover:shadow-brand-primary/5 transition-all duration-300"
                      >
                        <Switch
                          checked={checked}
                          disabled={disabled}
                          onCheckedChange={(v) => togglePermission(p.code, v)}
                          className="mt-1 data-[state=checked]:bg-brand-primary"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="text-xs font-black text-brand-primary leading-none uppercase tracking-tight">
                              {p.name}
                            </span>
                            {isDefault && (
                              <Badge className="bg-emerald-50 text-emerald-600 border-none rounded-md px-1.5 h-4 text-[8px] font-black uppercase tracking-tighter">
                                DEFAULT
                              </Badge>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 font-medium leading-relaxed line-clamp-2">
                            {p.description || p.code}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DataPanel>
  );
}

function RoleCheatsheet() {
  const { data, isLoading } = useQuery({
    queryKey: ["role-defaults"],
    queryFn: permissionsApi.roleDefaults,
  });
  const { data: catalog } = useQuery({
    queryKey: ["permissions-catalog"],
    queryFn: permissionsApi.catalog,
  });

  if (isLoading || !catalog) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-64 rounded-3xl" />
      </div>
    );
  }

  const roles: Array<keyof typeof ROLE_LABEL> = ["admin", "branch_manager", "hr"];

  return (
    <DataPanel
      title="Role Overview"
      description="View the default permissions defined for each user role."
    >
      <div className="overflow-x-auto -mx-6 px-6">
        <table className="w-full">
          <thead>
            <tr className="border-b border-brand-primary/5">
              <th className="py-5 pr-6 text-left">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Permission Name</span>
              </th>
              {roles.map((r) => (
                <th key={r} className="px-6 py-5 text-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{ROLE_LABEL[r]}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-primary/5">
            {catalog.map((p) => (
              <tr key={p.code} className="group hover:bg-slate-50/50 transition-colors">
                <td className="py-4 pr-6">
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-brand-primary leading-none uppercase tracking-tight group-hover:text-emerald-700 transition-colors">{p.name}</span>
                    <span className="text-[10px] font-mono text-slate-300 mt-1 uppercase tracking-tighter">{p.code}</span>
                  </div>
                </td>
                {roles.map((r) => {
                  const has = data?.[r as keyof typeof data]?.includes(p.code);
                  return (
                    <td key={r} className="px-6 py-4">
                      <div className="flex justify-center">
                        {has ? (
                          <div className="h-7 w-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                            <Check className="h-4 w-4 text-emerald-600 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="h-1 w-4 rounded-full bg-slate-100" />
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DataPanel>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-[40px] border-2 border-dashed border-brand-primary/5 bg-slate-50/50 p-20 text-center flex flex-col items-center">
      <div className="h-16 w-16 rounded-3xl bg-white shadow-premium flex items-center justify-center mb-6">
        <Sparkles className="h-8 w-8 text-slate-200" />
      </div>
      <p className="text-sm font-black text-slate-400 uppercase tracking-widest">{message}</p>
    </div>
  );
}
