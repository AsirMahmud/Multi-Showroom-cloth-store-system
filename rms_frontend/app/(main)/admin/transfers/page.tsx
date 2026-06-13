"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  ArrowRightLeft,
  Plus,
  Check,
  X,
  PackageCheck,
  Clock,
  ArrowRight,
  User,
  Building2,
  Filter,
} from "lucide-react";

import { RoleGuard } from "@/components/auth/role-guard";
import { useBranch } from "@/contexts/branch-context";
import { transfersApi, type StockTransfer } from "@/lib/api/transfers";
import { useToast } from "@/components/ui/use-toast";
import { PageLoading } from "@/components/ui/page-loading";
import { PageError } from "@/components/ui/page-error";
import { PageEmpty } from "@/components/ui/page-empty";
import { DataPanel, PageHeader, MetricCard } from "@/components/ui/professional";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

const STATUS_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  PENDING: { label: "Pending", className: "bg-amber-50 text-amber-600 border-amber-100" },
  APPROVED: { label: "Approved", className: "bg-blue-50 text-blue-600 border-blue-100" },
  COMPLETED: { label: "Completed", className: "bg-emerald-50 text-emerald-600 border-emerald-100" },
  CANCELLED: { label: "Cancelled", className: "bg-slate-50 text-slate-400 border-slate-100" },
};

export default function TransfersPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { availableBranches } = useBranch();
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["transfers", statusFilter],
    queryFn: () =>
      transfersApi.list({
        status: statusFilter === "all" ? undefined : statusFilter,
      }),
  });

  const approveMutation = useMutation({
    mutationFn: transfersApi.approve,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transfers"] });
      toast({ title: "Transfer Authorized", description: "Node migration has been approved." });
    },
  });

  const completeMutation = useMutation({
    mutationFn: transfersApi.complete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transfers"] });
      toast({ title: "Transfer Finalized", description: "Inventory nodes have been remapped successfully." });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: transfersApi.cancel,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transfers"] });
      toast({ title: "Transfer Aborted", description: "The node migration protocol was terminated." });
    },
  });

  const transfers = data?.results ?? [];

  return (
    <RoleGuard allow={["admin", "branch_manager"]}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <PageHeader
          title="Stock Migration"
          description="Orchestrate inventory transfers across the organizational grid nodes."
          icon={<ArrowRightLeft className="h-6 w-6" />}
        />

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Pending Approval"
            value={transfers.filter((t) => t.status === "PENDING").length}
            icon={<Clock className="h-5 w-5" />}
            tone="amber"
            helper="Requests awaiting authorization"
          />
          <MetricCard
            label="In Transit"
            value={transfers.filter((t) => t.status === "APPROVED").length}
            icon={<ArrowRightLeft className="h-5 w-5" />}
            tone="indigo"
            helper="Authorized and moving"
          />
          <MetricCard
            label="Remapped"
            value={transfers.filter((t) => t.status === "COMPLETED").length}
            icon={<PackageCheck className="h-5 w-5" />}
            tone="emerald"
            helper="Successfully migrated nodes"
          />
          <MetricCard
            label="Total Cycles"
            value={transfers.length}
            icon={<Activity className="h-5 w-5" />}
            tone="slate"
            helper="Cumulative migration events"
          />
        </div>

        <DataPanel
          title="Migration Directory"
          description="Monitor and authorize the movement of physical assets between branches."
          actions={
            <div className="flex items-center gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px] h-10 bg-slate-50 border-none rounded-xl font-bold text-xs text-brand-primary">
                  <div className="flex items-center gap-2">
                    <Filter className="h-3 w-3 text-slate-400" />
                    <SelectValue placeholder="Status Filter" />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-xl border-brand-primary/5">
                  <SelectItem value="all">Global Ledger</SelectItem>
                  <SelectItem value="PENDING">Awaiting Auth</SelectItem>
                  <SelectItem value="APPROVED">In Transit</SelectItem>
                  <SelectItem value="COMPLETED">Remapped</SelectItem>
                  <SelectItem value="CANCELLED">Aborted</SelectItem>
                </SelectContent>
              </Select>
            </div>
          }
        >
          {isLoading ? (
            <PageLoading count={4} columns="grid-cols-1" height="h-20" />
          ) : isError ? (
            <PageError onRetry={() => refetch()} />
          ) : transfers.length === 0 ? (
            <PageEmpty
              icon={ArrowRightLeft}
              title="Null Migration Set"
              description="Initiate a stock transfer to begin remapping inventory across branch nodes."
            />
          ) : (
            <div className="overflow-hidden rounded-[32px] border border-brand-primary/5 shadow-sm">
              <Table>
                <TableHeader className="bg-brand-primary">
                  <TableRow className="hover:bg-brand-primary border-none">
                    <TableHead className="text-brand-secondary font-black text-[10px] uppercase tracking-widest py-5 pl-8">Cycle ID</TableHead>
                    <TableHead className="text-brand-secondary font-black text-[10px] uppercase tracking-widest py-5">Node Vector</TableHead>
                    <TableHead className="text-brand-secondary font-black text-[10px] uppercase tracking-widest py-5">Asset Count</TableHead>
                    <TableHead className="text-brand-secondary font-black text-[10px] uppercase tracking-widest py-5">Protocol Status</TableHead>
                    <TableHead className="text-brand-secondary font-black text-[10px] uppercase tracking-widest py-5">Initiator</TableHead>
                    <TableHead className="text-brand-secondary font-black text-[10px] uppercase tracking-widest py-5">Temporal</TableHead>
                    <TableHead className="text-brand-secondary font-black text-[10px] uppercase tracking-widest py-5 text-right pr-8">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transfers.map((t) => {
                    const cfg = STATUS_CONFIG[t.status] || STATUS_CONFIG.PENDING;
                    return (
                      <TableRow key={t.id} className="group hover:bg-slate-50/50 transition-colors border-brand-primary/5">
                        <TableCell className="pl-8">
                          <span className="text-[10px] font-mono text-slate-400 font-black">#{t.id}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-brand-primary uppercase tracking-tight">{t.source_branch_name}</span>
                            <ArrowRight className="h-3 w-3 text-slate-300" />
                            <span className="text-xs font-black text-brand-primary uppercase tracking-tight">{t.dest_branch_name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-brand-secondary text-brand-primary border-brand-primary/10 rounded-md text-[9px] font-black uppercase tracking-widest">
                            {t.items?.length ?? 0} ASSETS
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn("px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border", cfg.className)} variant="secondary">
                            {cfg.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <User className="h-3 w-3 text-slate-300" />
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t.requested_by_name || "KERNEL"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-[10px] font-mono text-slate-400 uppercase font-black">
                            {format(new Date(t.created_at), "MMM d, HH:mm")}
                          </span>
                        </TableCell>
                        <TableCell className="text-right pr-8">
                          <div className="flex justify-end gap-2">
                            {t.status === "PENDING" && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 rounded-lg text-[9px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100 transition-all active:scale-95"
                                  onClick={() => approveMutation.mutate(t.id)}
                                  disabled={approveMutation.isPending}
                                >
                                  <Check className="h-3 w-3 mr-1" />
                                  Authorize
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 rounded-lg text-[9px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-all active:scale-95"
                                  onClick={() => cancelMutation.mutate(t.id)}
                                  disabled={cancelMutation.isPending}
                                >
                                  <X className="h-3 w-3 mr-1" />
                                  Abort
                                </Button>
                              </>
                            )}
                            {t.status === "APPROVED" && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 rounded-lg text-[9px] font-black uppercase tracking-widest bg-brand-primary text-brand-secondary border-none hover:bg-emerald-900 transition-all active:scale-95 shadow-lg shadow-brand-primary/20"
                                onClick={() => completeMutation.mutate(t.id)}
                                disabled={completeMutation.isPending}
                              >
                                <PackageCheck className="h-3 w-3 mr-1" />
                                Remap
                              </Button>
                            )}
                            {["COMPLETED", "CANCELLED"].includes(t.status) && (
                              <Button variant="ghost" size="sm" className="h-8 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-brand-primary hover:bg-brand-secondary/50">
                                Audit
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </DataPanel>
      </motion.div>
    </RoleGuard>
  );
}
