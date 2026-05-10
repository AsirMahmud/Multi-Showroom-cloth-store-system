"use client";

import { usePayroll, useRunPayroll } from "@/hooks/queries/use-hr";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataPanel } from "@/components/ui/professional";
import { Badge } from "@/components/ui/badge";
import { Wallet, Play, CheckCircle2, XCircle, Calendar, DollarSign, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo } from "react";

export function PayrollTable() {
  const { data, isLoading } = usePayroll();
  const runPayroll = useRunPayroll();

  const counts = useMemo(() => {
    if (!data) return { total: 0, paid: 0, pending: 0, amount: 0 };
    return data.reduce((acc, row) => {
      acc.total += 1;
      if (row.is_paid) acc.paid += 1;
      else acc.pending += 1;
      acc.amount += parseFloat(row.net_amount || "0");
      return acc;
    }, { total: 0, paid: 0, pending: 0, amount: 0 });
  }, [data]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-2">
        <KpiPill label="Total Ledger" value={counts.total} />
        <KpiPill label="Settled" value={counts.paid} tone="emerald" />
        <KpiPill label="Pending" value={counts.pending} tone="rose" />
        <KpiPill label="Total Liability" value={`$${counts.amount.toLocaleString()}`} tone="indigo" />
      </div>

      <DataPanel
        title="Compensation Ledger"
        description="Audit and settle recurring personnel liabilities."
        actions={
          <Button 
            onClick={() => runPayroll.mutate()} 
            disabled={runPayroll.isPending}
            className="h-10 px-4 bg-brand-primary text-brand-secondary hover:bg-emerald-900 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-brand-primary/20"
          >
            {runPayroll.isPending ? "Orchestrating..." : "Execute Monthly Grid"}
            <Play className="ml-2 h-3 w-3 fill-current" />
          </Button>
        }
      >
        <div className="overflow-hidden rounded-[24px] border border-brand-primary/5 shadow-sm">
          <Table>
            <TableHeader className="bg-brand-primary">
              <TableRow className="hover:bg-brand-primary border-none">
                <TableHead className="text-brand-secondary font-black text-[10px] uppercase tracking-widest py-4 pl-6">Beneficiary</TableHead>
                <TableHead className="text-brand-secondary font-black text-[10px] uppercase tracking-widest py-4">Temporal Cycle</TableHead>
                <TableHead className="text-brand-secondary font-black text-[10px] uppercase tracking-widest py-4">Net Disbursement</TableHead>
                <TableHead className="text-brand-secondary font-black text-[10px] uppercase tracking-widest py-4">Settlement Status</TableHead>
                <TableHead className="text-brand-secondary font-black text-[10px] uppercase tracking-widest py-4 text-right pr-6">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={5} className="py-6 px-6">
                      <Skeleton className="h-10 w-full rounded-xl" />
                    </TableCell>
                  </TableRow>
                ))
              ) : !data || data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-32 text-center">
                    <Wallet className="mx-auto mb-4 h-12 w-12 text-slate-200" />
                    <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Null Ledger</p>
                    <p className="text-xs text-slate-300 mt-2">Initialize the monthly grid to generate payroll records.</p>
                  </TableCell>
                </TableRow>
              ) : (
                data.map((row) => (
                  <TableRow key={row.id} className="group hover:bg-slate-50/50 transition-colors border-brand-primary/5">
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-brand-secondary text-brand-primary flex items-center justify-center font-black text-xs">
                          <User className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-black text-brand-primary uppercase tracking-tight">{row.employee_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-slate-500">
                        <Calendar className="h-3.5 w-3.5" />
                        <span className="text-[11px] font-bold uppercase tracking-wider">{row.period_start}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-brand-primary">
                        <DollarSign className="h-3.5 w-3.5 text-slate-300" />
                        <span className="text-sm font-black">{parseFloat(row.net_amount || "0").toLocaleString()}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {row.is_paid ? (
                        <div className="flex items-center gap-1.5 text-emerald-600">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Settled</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-rose-500">
                          <XCircle className="h-3.5 w-3.5" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Pending</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right pr-6">
                       <Button variant="ghost" size="sm" className="h-8 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-brand-primary hover:bg-brand-secondary/50">
                         Audit
                       </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </DataPanel>
    </div>
  );
}

function KpiPill({
  label,
  value,
  tone = "slate",
}: {
  label: string;
  value: string | number;
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
