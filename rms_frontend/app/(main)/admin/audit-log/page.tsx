"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  Shield,
  Filter,
  Plus,
  Pencil,
  Trash2,
  Eye,
  Search,
  Calendar,
  Building2,
  Activity,
  User,
} from "lucide-react";

import { RoleGuard } from "@/components/auth/role-guard";
import { useAuditLog } from "@/hooks/queries/use-audit-log";
import { useBranch } from "@/contexts/branch-context";
import { PageLoading } from "@/components/ui/page-loading";
import { PageError } from "@/components/ui/page-error";
import { PageEmpty } from "@/components/ui/page-empty";
import { DataPanel, PageHeader } from "@/components/ui/professional";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

import type { AuditLogEntry, AuditLogFilters } from "@/lib/api/audit-log";

const ACTION_CONFIG = {
  CREATE: { label: "Initialized", icon: Plus, className: "bg-emerald-50 text-emerald-600 border-emerald-100" },
  UPDATE: { label: "Modified", icon: Pencil, className: "bg-amber-50 text-amber-600 border-amber-100" },
  DELETE: { label: "Purged", icon: Trash2, className: "bg-rose-50 text-rose-600 border-rose-100" },
} as const;

export default function AuditLogPage() {
  const { availableBranches } = useBranch();
  const [filters, setFilters] = useState<AuditLogFilters>({});
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<AuditLogEntry | null>(null);

  const { data, isLoading, isError, refetch } = useAuditLog({
    ...filters,
    page,
  });

  const entries = data?.results ?? [];
  const totalPages = data ? Math.ceil(data.count / 10) : 1;

  return (
    <RoleGuard allow={["admin"]}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <PageHeader
          title="Security Audit Ledger"
          description="A comprehensive immutable trace of all organizational data mutations."
          icon={<Shield className="h-6 w-6" />}
        />

        <DataPanel
          title="Intelligence Filters"
          description="Drill into specific mutation vectors by action, entity, or geographic node."
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <LabelPill label="Action Vector" />
              <Select
                value={filters.action || "all"}
                onValueChange={(v) =>
                  setFilters((f) => ({ ...f, action: v === "all" ? undefined : v }))
                }
              >
                <SelectTrigger className="h-11 bg-slate-50 border-none rounded-xl font-bold text-sm text-brand-primary">
                  <div className="flex items-center gap-2">
                    <Activity className="h-3.5 w-3.5 text-slate-400" />
                    <SelectValue placeholder="All Actions" />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-xl border-brand-primary/5">
                  <SelectItem value="all">Every Mutation</SelectItem>
                  <SelectItem value="CREATE">Initialization</SelectItem>
                  <SelectItem value="UPDATE">Modification</SelectItem>
                  <SelectItem value="DELETE">Purge</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <LabelPill label="Entity Type" />
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  placeholder="e.g. Product"
                  value={filters.entity_type || ""}
                  onChange={(e) =>
                    setFilters((f) => ({
                      ...f,
                      entity_type: e.target.value || undefined,
                    }))
                  }
                  className="pl-10 h-11 bg-slate-50 border-none rounded-xl font-bold text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <LabelPill label="Origin Node" />
              <Select
                value={filters.branch?.toString() || "all"}
                onValueChange={(v) =>
                  setFilters((f) => ({
                    ...f,
                    branch: v === "all" ? undefined : parseInt(v),
                  }))
                }
              >
                <SelectTrigger className="h-11 bg-slate-50 border-none rounded-xl font-bold text-sm text-brand-primary">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-3.5 w-3.5 text-slate-400" />
                    <SelectValue placeholder="Every Branch" />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-xl border-brand-primary/5">
                  <SelectItem value="all">Global Grid</SelectItem>
                  {availableBranches.map((b) => (
                    <SelectItem key={b.id} value={b.id.toString()}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <LabelPill label="Temporal Horizon" />
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  type="date"
                  value={filters.created_at__gte || ""}
                  onChange={(e) =>
                    setFilters((f) => ({
                      ...f,
                      created_at__gte: e.target.value || undefined,
                    }))
                  }
                  className="pl-10 h-11 bg-slate-50 border-none rounded-xl font-bold text-sm"
                />
              </div>
            </div>
          </div>
        </DataPanel>

        {isLoading ? (
          <PageLoading count={6} columns="grid-cols-1" height="h-20" />
        ) : isError ? (
          <PageError onRetry={() => refetch()} />
        ) : entries.length === 0 ? (
          <PageEmpty
            icon={Shield}
            title="Null Trace Set"
            description="Activity will materialize here as mutations are injected into the system."
          />
        ) : (
          <div className="space-y-6">
            <div className="overflow-hidden rounded-[32px] border border-brand-primary/5 bg-white/50 backdrop-blur-xl shadow-premium">
              <Table>
                <TableHeader className="bg-brand-primary">
                  <TableRow className="hover:bg-brand-primary border-none">
                    <TableHead className="text-brand-secondary font-black text-[10px] uppercase tracking-widest py-5 pl-8">Temporal ID</TableHead>
                    <TableHead className="text-brand-secondary font-black text-[10px] uppercase tracking-widest py-5">Actor</TableHead>
                    <TableHead className="text-brand-secondary font-black text-[10px] uppercase tracking-widest py-5">Mutation Vector</TableHead>
                    <TableHead className="text-brand-secondary font-black text-[10px] uppercase tracking-widest py-5">Entity Node</TableHead>
                    <TableHead className="text-brand-secondary font-black text-[10px] uppercase tracking-widest py-5">Origin</TableHead>
                    <TableHead className="text-brand-secondary font-black text-[10px] uppercase tracking-widest py-5 text-right pr-8">Audit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => {
                    const cfg = ACTION_CONFIG[entry.action] || ACTION_CONFIG.UPDATE;
                    const Icon = cfg.icon;
                    return (
                      <TableRow key={entry.id} className="group hover:bg-white transition-colors border-brand-primary/5">
                        <TableCell className="pl-8">
                          <span className="text-[10px] font-mono text-slate-400 uppercase font-black">
                            {format(new Date(entry.created_at), "MMM d, HH:mm:ss")}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-lg bg-slate-100 flex items-center justify-center">
                              <User className="h-3.5 w-3.5 text-slate-400" />
                            </div>
                            <span className="text-xs font-black text-brand-primary uppercase tracking-tight">
                              {entry.actor_username || "System Kernel"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn("px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border shadow-sm", cfg.className)} variant="secondary">
                            <Icon className="h-3 w-3 mr-1" />
                            {cfg.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-xs font-black text-brand-primary uppercase tracking-tighter">
                              {entry.entity_type} <span className="text-slate-300 font-mono">#{entry.entity_id}</span>
                            </span>
                            {entry.entity_repr && (
                              <span className="text-[10px] text-slate-400 font-medium truncate max-w-[240px]">
                                {entry.entity_repr}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Building2 className="h-3 w-3 text-slate-300" />
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                              {entry.branch_name || "Global Root"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right pr-8">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-xl hover:bg-brand-secondary/50 transition-all active:scale-90"
                            onClick={() => setDetail(entry)}
                          >
                            <Eye className="h-4 w-4 text-slate-400" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 py-4">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="h-10 px-4 rounded-xl border-brand-primary/5 font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-brand-primary"
                >
                  Prev Epoch
                </Button>
                <div className="bg-brand-secondary/30 px-4 h-10 flex items-center rounded-xl border border-brand-primary/5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-brand-primary">
                    Horizon {page} / {totalPages}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="h-10 px-4 rounded-xl border-brand-primary/5 font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-brand-primary"
                >
                  Next Epoch
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Detail Dialog */}
        <Dialog open={!!detail} onOpenChange={() => setDetail(null)}>
          <DialogContent className="max-w-2xl max-h-[85vh] p-0 border-none bg-transparent shadow-none">
            {detail && (
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-[40px] shadow-2xl overflow-hidden border border-brand-primary/5"
              >
                <div className="p-8 bg-brand-primary flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-black text-brand-secondary uppercase tracking-tight">
                      Mutation Intelligence
                    </h3>
                    <p className="text-[10px] text-brand-secondary/60 font-black uppercase tracking-widest mt-1">
                      {detail.action} — {detail.entity_type} Node #{detail.entity_id}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center">
                    <Shield className="h-6 w-6 text-brand-secondary" />
                  </div>
                </div>
                
                <div className="p-8 space-y-8">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Origin Node</p>
                      <p className="text-xs font-black text-brand-primary uppercase tracking-tight">{detail.branch_name || "Global Root"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Actor Signature</p>
                      <p className="text-xs font-black text-brand-primary uppercase tracking-tight">{detail.actor_username || "System Kernel"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Network Origin (IP)</p>
                      <p className="text-xs font-black text-slate-500 font-mono tracking-tight">{detail.ip_address || "Internal Core"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Temporal ID</p>
                      <p className="text-xs font-black text-brand-primary uppercase tracking-tight">{format(new Date(detail.created_at), "PPpp")}</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {detail.before_json && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pre-Mutation State</p>
                        </div>
                        <pre className="bg-slate-50 rounded-2xl p-6 text-[11px] font-mono font-bold text-slate-600 overflow-x-auto max-h-48 border border-slate-100">
                          {JSON.stringify(detail.before_json, null, 2)}
                        </pre>
                      </div>
                    )}
                    {detail.after_json && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Post-Mutation State</p>
                        </div>
                        <pre className="bg-emerald-50/30 rounded-2xl p-6 text-[11px] font-mono font-bold text-emerald-900 overflow-x-auto max-h-48 border border-emerald-100/50">
                          {JSON.stringify(detail.after_json, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>

                  <Button 
                    onClick={() => setDetail(null)}
                    className="w-full h-12 rounded-2xl bg-brand-primary text-brand-secondary font-black uppercase tracking-widest hover:bg-emerald-900 transition-all shadow-lg shadow-brand-primary/20"
                  >
                    Acknowledge & Close
                  </Button>
                </div>
              </motion.div>
            )}
          </DialogContent>
        </Dialog>
      </motion.div>
    </RoleGuard>
  );
}

function LabelPill({ label }: { label: string }) {
  return (
    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 block mb-1.5">
      {label}
    </label>
  );
}
