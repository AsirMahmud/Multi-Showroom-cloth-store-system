"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Building2, Mail, Search, ShieldCheck, UserRound, ArrowRight } from "lucide-react";

import { accountsApi } from "@/lib/api/accounts";
import { branchesApi } from "@/lib/api/branches";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export function ManagerDirectory() {
  const [search, setSearch] = useState("");

  const { data: accounts, isLoading } = useQuery({
    queryKey: ["admin-accounts-for-managers"],
    queryFn: accountsApi.list,
  });

  const { data: branches } = useQuery({
    queryKey: ["branches"],
    queryFn: branchesApi.getBranches,
  });

  const branchById = useMemo(() => {
    const map = new Map<number, string>();
    (branches ?? []).forEach((b) => map.set(b.id, b.name));
    return map;
  }, [branches]);

  const managers = useMemo(() => {
    if (!accounts) return [];
    return accounts
      .filter((a) => a.role === "branch_manager")
      .filter((a) => {
        if (!search.trim()) return true;
        const needle = search.toLowerCase();
        return (
          a.username.toLowerCase().includes(needle) ||
          (a.email || "").toLowerCase().includes(needle) ||
          (a.managed_branch_name ?? "").toLowerCase().includes(needle)
        );
      });
  }, [accounts, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#163625] flex items-center gap-2">
            <UserRound className="h-6 w-6" /> Manager Directory
          </h2>
          <p className="text-sm text-slate-500">
            View active branch managers and their assignments.
          </p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search managers..."
            className="pl-9 bg-slate-50 border-slate-200"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-2xl" />
          ))}
        </div>
      ) : managers.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed bg-slate-50/50 p-12 text-center">
          <UserRound className="h-12 w-12 text-slate-300 mx-auto mb-3 opacity-50" />
          <p className="text-slate-500 font-medium">No branch managers found matching your search.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {managers.map((m) => (
            <div
              key={m.id}
              className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:border-[#163625]/20 hover:shadow-xl hover:translate-y-[-2px]"
            >
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <ShieldCheck className="h-16 w-16 text-[#163625]" />
              </div>
              
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#E4FCD5] text-lg font-bold text-[#163625]">
                  {m.username.slice(0, 1).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-bold text-[#163625] text-lg">
                      {m.first_name ? `${m.first_name} ${m.last_name || ""}` : m.username}
                    </p>
                    {m.is_active ? (
                      <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-0 text-[10px]">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="text-[10px] border-0">
                        Inactive
                      </Badge>
                    )}
                  </div>
                  <p className="truncate text-sm text-slate-500 mb-4 font-medium">@{m.username}</p>
                  
                  <div className="grid grid-cols-1 gap-2">
                    <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <Building2 className="h-4 w-4 text-[#163625]/50" />
                      <span className="truncate font-semibold">
                        {m.managed_branch_name ||
                          (m.managed_branch
                            ? branchById.get(m.managed_branch) ?? "—"
                            : "No Branch Assigned")}
                      </span>
                    </div>
                    {m.email && (
                      <div className="flex items-center gap-2 text-sm text-slate-500 px-2">
                        <Mail className="h-4 w-4 opacity-50" />
                        <span className="truncate">{m.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
