"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ShieldCheck, Sparkles, UserCheck } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

const CATEGORY_TITLE: Record<PermissionCatalogItem["category"], string> = {
  global: "Global resources",
  branch: "Branch operations",
  system: "System & administration",
};

const ROLE_LABEL: Record<string, string> = {
  admin: "Admin",
  branch_manager: "Branch Manager",
  hr: "HR",
};

export function RolesAndPermissions() {
  return (
    <Tabs defaultValue="grants" className="space-y-4">
      <TabsList>
        <TabsTrigger value="grants">
          <UserCheck className="mr-2 h-4 w-4" /> Per-user grants
        </TabsTrigger>
        <TabsTrigger value="cheatsheet">
          <Sparkles className="mr-2 h-4 w-4" /> Role cheatsheet
        </TabsTrigger>
      </TabsList>
      <TabsContent value="grants">
        <PerUserGrants />
      </TabsContent>
      <TabsContent value="cheatsheet">
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
    <Card className="border border-slate-200/80 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCheck className="h-5 w-5" /> Per-user permission grants
        </CardTitle>
        <CardDescription>
          Pick a user to view their inherited (role) permissions and toggle
          additional explicit grants. Admins implicitly have every permission.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="md:w-80">
            <Select
              value={selectedUserId ? String(selectedUserId) : ""}
              onValueChange={(v) => setSelectedUserId(Number(v))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a user" />
              </SelectTrigger>
              <SelectContent>
                {accountsLoading ? (
                  <SelectItem value="loading" disabled>
                    Loading...
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
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600">
                Role: {ROLE_LABEL[selectedAccount.role] ?? selectedAccount.role}
              </Badge>
              {selectedAccount.managed_branch_name && (
                <Badge variant="outline" className="border-indigo-200 bg-indigo-50 text-indigo-700">
                  Branch: {selectedAccount.managed_branch_name}
                </Badge>
              )}
              {selectedAccount.role === "admin" ? (
                <Badge className="bg-amber-100 text-amber-800">
                  All permissions (implicit)
                </Badge>
              ) : null}
            </div>
          ) : null}
        </div>

        {!selectedUserId ? (
          <EmptyState message="Select a user to view their permissions." />
        ) : userPermsLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-3">
            {(["global", "branch", "system"] as const).map((cat) => (
              <Card
                key={cat}
                className="border-slate-200/80 bg-gradient-to-br from-white to-slate-50/40"
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-slate-800">
                    {CATEGORY_TITLE[cat]}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
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
                        className="flex items-start gap-3 rounded-md border border-transparent p-2 hover:border-slate-200 hover:bg-white"
                      >
                        <Switch
                          checked={checked}
                          disabled={disabled}
                          onCheckedChange={(v) => togglePermission(p.code, v)}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-800">
                              {p.name}
                            </span>
                            {isDefault && (
                              <Badge
                                variant="outline"
                                className="border-emerald-200 bg-emerald-50 text-[10px] text-emerald-700"
                              >
                                role default
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-slate-500">
                            {p.description || p.code}
                          </p>
                          <code className="mt-0.5 inline-block text-[10px] font-mono text-slate-400">
                            {p.code}
                          </code>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
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
    return <Skeleton className="h-64 w-full" />;
  }

  const roles: Array<keyof typeof ROLE_LABEL> = ["admin", "branch_manager", "hr"];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" /> Role capability matrix
        </CardTitle>
        <CardDescription>
          What each role can do by default. Specific users can be granted extra
          codes from the &ldquo;Per-user grants&rdquo; tab.
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs uppercase tracking-wider text-slate-500">
              <th className="py-2 pr-4">Permission</th>
              {roles.map((r) => (
                <th key={r} className="px-2 py-2 text-center">
                  {ROLE_LABEL[r]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {catalog.map((p) => (
              <tr key={p.code} className="border-b last:border-0 hover:bg-slate-50/60">
                <td className="py-2 pr-4">
                  <div className="font-medium text-slate-800">{p.name}</div>
                  <div className="text-xs text-slate-500">{p.code}</div>
                </td>
                {roles.map((r) => {
                  const has = data?.[r as keyof typeof data]?.includes(p.code);
                  return (
                    <td key={r} className="px-2 py-2 text-center">
                      {has ? (
                        <Check className="mx-auto h-4 w-4 text-emerald-600" />
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed bg-slate-50 p-10 text-center">
      <Sparkles className="mx-auto h-8 w-8 text-slate-400" />
      <p className="mt-2 text-sm font-medium text-slate-600">{message}</p>
    </div>
  );
}
