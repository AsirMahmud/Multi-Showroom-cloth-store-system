"use client";

import { useIntegrityCheck } from "@/hooks/queries/use-reports";
import { DataPanel, MetricCard, TableShell, StatusBadge } from "@/components/ui/professional";
import { AlertCircle, CheckCircle2, Package, ShoppingCart, DollarSign, Layers, Search, RefreshCw } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

export function IntegrityReport() {
  const { data, isLoading, refetch, isRefetching } = useIntegrityCheck();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <RefreshCw className="h-10 w-10 text-brand-primary animate-spin" />
        <p className="text-slate-500 font-bold animate-pulse uppercase tracking-widest text-[10px]">Scanning Database Infrastructure...</p>
      </div>
    );
  }

  const hasIssues = (data?.summary.total_issues ?? 0) > 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {hasIssues ? (
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 shadow-sm">
              <AlertCircle className="h-6 w-6" />
            </div>
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500 shadow-sm">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          )}
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              {hasIssues ? "Action Required: Data Inconsistencies Found" : "System Status: Data Integrity Verified"}
            </h2>
            <p className="text-sm text-slate-500 font-medium">
              {hasIssues 
                ? `Detected ${data?.summary.total_issues} discrepancies across financial and inventory models.`
                : "All top-level aggregates match their underlying transactional details."}
            </p>
          </div>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => refetch()} 
          disabled={isRefetching}
          className="h-10 rounded-xl bg-white border-brand-primary/5 shadow-sm font-bold text-[10px] uppercase tracking-widest text-brand-primary"
        >
          <RefreshCw className={isRefetching ? "h-3.5 w-3.5 mr-2 animate-spin" : "h-3.5 w-3.5 mr-2"} />
          {isRefetching ? "Scanning..." : "Trigger Full Scan"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Inventory Drift"
          value={data?.summary.stock_mismatches ?? 0}
          icon={<Package className="h-5 w-5" />}
          tone={(data?.summary.stock_mismatches ?? 0) > 0 ? "rose" : "emerald"}
          helper="Variation vs. Parent mismatch"
        />
        <MetricCard
          label="Transaction Delta"
          value={data?.summary.sale_mismatches ?? 0}
          icon={<ShoppingCart className="h-5 w-5" />}
          tone={(data?.summary.sale_mismatches ?? 0) > 0 ? "rose" : "emerald"}
          helper="Total vs. Itemized mismatch"
        />
        <MetricCard
          label="Payment Variance"
          value={data?.summary.payment_mismatches ?? 0}
          icon={<DollarSign className="h-5 w-5" />}
          tone={(data?.summary.payment_mismatches ?? 0) > 0 ? "rose" : "emerald"}
          helper="Paid vs. Record mismatch"
        />
        <MetricCard
          label="Orphaned Categories"
          value={data?.summary.empty_categories ?? 0}
          icon={<Layers className="h-5 w-5" />}
          tone={(data?.summary.empty_categories ?? 0) > 0 ? "amber" : "slate"}
          helper="Categories with zero products"
        />
      </div>

      <div className="grid gap-8">
        {(data?.details.stock_mismatches.length ?? 0) > 0 && (
          <DataPanel 
            title="Inventory Discrepancies" 
            description="Products where the total stock count does not equal the sum of variation stock."
          >
            <TableShell>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-4">Product / SKU</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-4 text-right">Reported</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-4 text-right">Calculated</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-4 text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.details.stock_mismatches.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell className="py-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-slate-900">{item.name}</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.sku}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right py-4 font-bold text-slate-600">{item.reported_stock}</TableCell>
                      <TableCell className="text-right py-4 font-bold text-slate-600">{item.calculated_stock}</TableCell>
                      <TableCell className="text-right py-4">
                        <StatusBadge label="Mismatch" tone="rose" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableShell>
          </DataPanel>
        )}

        {(data?.details.sale_mismatches.length ?? 0) > 0 && (
          <DataPanel 
            title="Transaction Discrepancies" 
            description="Completed sales where the invoice total differs from the sum of line items."
          >
            <TableShell>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-4">Invoice</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-4 text-right">Actual Total</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-4 text-right">Calculated</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-4 text-right">Delta</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.details.sale_mismatches.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell className="py-4">
                        <span className="text-xs font-black text-slate-900">{item.invoice_number}</span>
                      </TableCell>
                      <TableCell className="text-right py-4 font-bold text-slate-600">${item.actual_total}</TableCell>
                      <TableCell className="text-right py-4 font-bold text-slate-600">${item.expected_total}</TableCell>
                      <TableCell className="text-right py-4">
                        <span className="text-xs font-black text-rose-500">${item.difference}</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableShell>
          </DataPanel>
        )}

        {(data?.details.empty_categories.length ?? 0) > 0 && (
          <DataPanel 
            title="Inventory Map Coverage" 
            description="Categories currently containing no products. Consider consolidating or populating these."
          >
            <div className="flex flex-wrap gap-2">
              {data?.details.empty_categories.map((cat: any) => (
                <StatusBadge key={cat.id} label={cat.name} tone="amber" className="px-4 py-1.5" />
              ))}
            </div>
          </DataPanel>
        )}
      </div>
    </div>
  );
}
