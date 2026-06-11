"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { AlertCircle, ArrowLeft, CheckCircle2, ReceiptText, Search, Undo2 } from "lucide-react";
import { PageHeader, DataPanel, MetricCard } from "@/components/ui/professional";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useDebounce } from "@/hooks/use-debounce";
import { useToast } from "@/hooks/use-toast";
import { useSale, useSales } from "@/hooks/queries/use-sales";
import { createReturn as createReturnApi, CreateReturnPayload } from "@/lib/api/sales";
import { cn, formatCurrency } from "@/lib/utils";
import type { ReturnItem, SaleItem, SaleStatus } from "@/types/sales";

type SaleItemSelection = {
  quantity: number;
  reason: string;
};

const ELIGIBLE_STATUSES: SaleStatus[] = ["completed"];

export default function NewSalesReturnPage() {
  const params = useSearchParams();
  const initialInvoice = params.get("invoice") || "";
  const initialSaleId = params.get("sale");

  const [searchTerm, setSearchTerm] = useState(initialInvoice);
  const [selectedSaleId, setSelectedSaleId] = useState<number | null>(
    initialSaleId ? Number(initialSaleId) : null
  );
  const [globalReason, setGlobalReason] = useState("");
  const [itemSelections, setItemSelections] = useState<Record<number, SaleItemSelection>>({});

  const debouncedSearch = useDebounce(searchTerm, 400);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { sales, isLoading: isSearchingSales } = useSales({
    search: debouncedSearch || undefined,
    status: "completed",
    ordering: "-date",
    page: 1,
    page_size: 8,
  });

  const { sale, isLoading: isLoadingSale } = useSale(selectedSaleId ?? 0);

  useEffect(() => {
    if (!initialSaleId || selectedSaleId) return;
    const parsed = Number(initialSaleId);
    if (!Number.isNaN(parsed) && parsed > 0) {
      setSelectedSaleId(parsed);
    }
  }, [initialSaleId, selectedSaleId]);

  const selectedSale = sale && ELIGIBLE_STATUSES.includes((sale.status || "pending") as SaleStatus) ? sale : null;

  const returnedQuantities = useMemo(() => {
    const quantities = new Map<number, number>();
    if (!selectedSale?.returns) return quantities;

    selectedSale.returns
      .filter((returnOrder) => returnOrder.status !== "rejected")
      .forEach((returnOrder) => {
        returnOrder.items?.forEach((item: ReturnItem) => {
          const saleItemId =
            typeof item.sale_item === "object" && item.sale_item
              ? item.sale_item.id
              : typeof item.sale_item === "number"
                ? item.sale_item
                : item.sale_item_id;

          if (!saleItemId) return;
          quantities.set(saleItemId, (quantities.get(saleItemId) || 0) + item.quantity);
        });
      });

    return quantities;
  }, [selectedSale]);

  const saleItems = selectedSale?.items || [];

  const createReturnMutation = useMutation({
    mutationFn: ({ saleId, data }: { saleId: number; data: CreateReturnPayload }) =>
      createReturnApi(saleId, data),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["returns"] });
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["sale", selectedSaleId] });
      toast({
        title: "Return created",
        description: `Return ${created.return_number} is now pending approval.`,
      });
      setItemSelections({});
      setGlobalReason("");
    },
    onError: (error: any) => {
      toast({
        title: "Return failed",
        description:
          error?.response?.data?.items ||
          error?.response?.data?.detail ||
          error?.response?.data?.sale_id ||
          "Could not create the return request.",
        variant: "destructive",
      });
    },
  });

  const selectableSales = useMemo(() => {
    return (sales || []).filter((entry) =>
      ELIGIBLE_STATUSES.includes((entry.status || "pending") as SaleStatus)
    );
  }, [sales]);

  const lineItems = useMemo(() => {
    return saleItems.map((item) => {
      const returned = item.id ? returnedQuantities.get(item.id) || 0 : 0;
      const available = Math.max(0, item.quantity - returned);
      const selection = (item.id && itemSelections[item.id]) || { quantity: 0, reason: "" };
      const unitRefund = item.quantity > 0 ? Number(item.total || 0) / item.quantity : Number(item.unit_price || 0);
      const selectedRefund = selection.quantity * unitRefund;

      return {
        item,
        returned,
        available,
        selection,
        unitRefund,
        selectedRefund,
      };
    });
  }, [saleItems, returnedQuantities, itemSelections]);

  const refundAmount = useMemo(
    () => lineItems.reduce((total, row) => total + row.selectedRefund, 0),
    [lineItems]
  );

  const selectedCount = useMemo(
    () => lineItems.reduce((count, row) => count + (row.selection.quantity > 0 ? 1 : 0), 0),
    [lineItems]
  );

  const updateSelection = (saleItemId: number, patch: Partial<SaleItemSelection>) => {
    setItemSelections((current) => ({
      ...current,
      [saleItemId]: {
        quantity: current[saleItemId]?.quantity || 0,
        reason: current[saleItemId]?.reason || "",
        ...patch,
      },
    }));
  };

  const handleSubmit = () => {
    if (!selectedSaleId || !selectedSale) return;

    const items = lineItems
      .filter((row) => row.selection.quantity > 0)
      .map((row) => ({
        sale_item_id: row.item.id!,
        quantity: row.selection.quantity,
        reason: row.selection.reason.trim() || globalReason.trim(),
      }));

    if (items.length === 0) {
      toast({
        title: "No items selected",
        description: "Choose at least one sale item quantity to return.",
        variant: "destructive",
      });
      return;
    }

    const missingReason = items.some((item) => !item.reason);
    if (missingReason) {
      toast({
        title: "Reason required",
        description: "Add a return reason globally or per selected item.",
        variant: "destructive",
      });
      return;
    }

    createReturnMutation.mutate({
      saleId: selectedSaleId,
      data: {
        reason: globalReason.trim() || "Item-level reasons provided",
        refund_amount: Number(refundAmount.toFixed(2)),
        items,
      },
    });
  };

  return (
    <div className="space-y-8 p-4 md:p-8">
      <PageHeader
        title="Create Sales Return"
        description="Search a completed invoice, select returnable items, and raise a pending refund request."
        icon={<Undo2 className="h-6 w-6" />}
        actions={
          <div className="flex gap-3">
            <Button asChild variant="outline" className="h-10 rounded-xl font-bold text-xs uppercase tracking-widest">
              <Link href="/sales/returns">
                <ArrowLeft className="mr-2 h-3.5 w-3.5" />
                Back to Returns
              </Link>
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.1fr_.9fr]">
        <DataPanel title="Find Invoice" description="Only completed sales are eligible for returns in this first version.">
          <div className="space-y-5">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by invoice number, customer, or phone"
                className="h-12 rounded-xl border-none bg-slate-50 pl-10 font-bold"
              />
            </div>

            <div className="space-y-3">
              {isSearchingSales && debouncedSearch ? (
                [...Array(3)].map((_, idx) => <Skeleton key={idx} className="h-20 rounded-2xl" />)
              ) : selectableSales.length > 0 ? (
                selectableSales.map((entry) => {
                  const isActive = selectedSaleId === entry.id;
                  return (
                    <button
                      key={entry.id}
                      onClick={() => setSelectedSaleId(entry.id || null)}
                      className={cn(
                        "w-full rounded-2xl border p-4 text-left transition-all",
                        isActive
                          ? "border-brand-primary bg-brand-primary/5 shadow-sm"
                          : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-black text-brand-primary">{entry.invoice_number}</p>
                          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                            {(entry.customer &&
                              typeof entry.customer === "object" &&
                              `${entry.customer.first_name} ${entry.customer.last_name}`) ||
                              entry.customer_phone ||
                              "Guest"}
                          </p>
                        </div>
                        <Badge className="bg-emerald-100 text-emerald-800 border-none font-black text-[10px] uppercase tracking-widest">
                          {entry.status}
                        </Badge>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-xs font-bold text-slate-500">
                        <span>{entry.branch_name || "Unassigned branch"}</span>
                        <span>{formatCurrency(entry.total)}</span>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm font-bold text-slate-400">
                  Start with an invoice search to load a completed sale.
                </div>
              )}
            </div>
          </div>
        </DataPanel>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-1">
          <MetricCard
            label="Selected Items"
            value={selectedCount.toString()}
            icon={<ReceiptText className="h-5 w-5" />}
            helper="Return lines currently marked"
          />
          <MetricCard
            label="Refund Preview"
            value={formatCurrency(refundAmount)}
            icon={<CheckCircle2 className="h-5 w-5" />}
            helper="Auto-calculated from original sale values"
            tone="emerald"
          />
          <MetricCard
            label="Sale Status Rule"
            value="Completed"
            icon={<AlertCircle className="h-5 w-5" />}
            helper="Only completed invoices can be returned"
            tone="amber"
          />
        </div>
      </div>

      <DataPanel
        title="Return Builder"
        description={
          selectedSale
            ? `Preparing a pending return for invoice ${selectedSale.invoice_number}.`
            : "Choose a sale to start selecting items."
        }
      >
        {!selectedSaleId || isLoadingSale ? (
          <div className="space-y-4">
            <Skeleton className="h-16 rounded-2xl" />
            <Skeleton className="h-40 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
          </div>
        ) : !selectedSale ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
            <p className="text-sm font-bold text-slate-500">
              This sale is not eligible for returns in the current workflow.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4 rounded-3xl border border-slate-100 bg-slate-50 p-5 md:grid-cols-4">
              <div>
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Invoice</Label>
                <p className="mt-2 text-sm font-black text-brand-primary">{selectedSale.invoice_number}</p>
              </div>
              <div>
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Customer</Label>
                <p className="mt-2 text-sm font-bold text-slate-700">
                  {(selectedSale.customer &&
                    typeof selectedSale.customer === "object" &&
                    `${selectedSale.customer.first_name} ${selectedSale.customer.last_name}`) ||
                    selectedSale.customer_phone ||
                    "Guest"}
                </p>
              </div>
              <div>
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Branch</Label>
                <p className="mt-2 text-sm font-bold text-slate-700">{selectedSale.branch_name || "Unassigned"}</p>
              </div>
              <div>
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Invoice Total</Label>
                <p className="mt-2 text-sm font-black text-brand-primary">{formatCurrency(selectedSale.total)}</p>
              </div>
            </div>

            <div className="space-y-4">
              {lineItems.map(({ item, returned, available, selection, unitRefund, selectedRefund }) => (
                <div key={item.id} className="rounded-3xl border border-slate-100 p-5 shadow-sm">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-black text-brand-primary">{item.product?.name || "Product"}</p>
                      <div className="flex flex-wrap gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        <span>{item.design_name || "Standard"}</span>
                        <span>{item.color}</span>
                        <span>Sold: {item.quantity}</span>
                        <span>Returned: {returned}</span>
                        <span>Available: {available}</span>
                      </div>
                      <p className="text-xs font-bold text-slate-400">
                        Refund value per unit: {formatCurrency(unitRefund)}
                      </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-[120px_1fr_160px] lg:min-w-[540px]">
                      <div>
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Quantity
                        </Label>
                        <Input
                          type="number"
                          min={0}
                          max={available}
                          value={selection.quantity}
                          onChange={(e) => {
                            const next = Math.max(0, Math.min(available, Number(e.target.value) || 0));
                            updateSelection(item.id!, { quantity: next });
                          }}
                          className="mt-2 h-11 rounded-xl"
                        />
                      </div>

                      <div>
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Item Reason
                        </Label>
                        <Input
                          value={selection.reason}
                          onChange={(e) => updateSelection(item.id!, { reason: e.target.value })}
                          placeholder={globalReason ? "Uses global reason if left blank" : "Reason for this return"}
                          className="mt-2 h-11 rounded-xl"
                        />
                      </div>

                      <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Selected Refund
                        </p>
                        <p className="mt-2 text-sm font-black text-brand-primary">
                          {formatCurrency(selectedRefund)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid gap-6 rounded-3xl border border-slate-100 bg-slate-50 p-6 lg:grid-cols-[1.2fr_.8fr]">
              <div>
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Global Return Reason
                </Label>
                <Textarea
                  value={globalReason}
                  onChange={(e) => setGlobalReason(e.target.value)}
                  placeholder="Example: Customer found a stitching defect after purchase."
                  className="mt-2 min-h-[120px] rounded-2xl bg-white"
                />
                <p className="mt-2 text-xs font-bold text-slate-400">
                  This is used as the master reason and as a fallback for any selected item left blank.
                </p>
              </div>

              <div className="rounded-3xl bg-white p-5 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Approval Summary</p>
                <div className="mt-4 space-y-3 text-sm font-bold text-slate-600">
                  <div className="flex items-center justify-between">
                    <span>Selected lines</span>
                    <span>{selectedCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Status on submit</span>
                    <span>Pending</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Refund amount</span>
                    <span className="text-brand-primary">{formatCurrency(refundAmount)}</span>
                  </div>
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={createReturnMutation.isPending || !selectedSaleId}
                  className="mt-6 h-12 w-full rounded-xl bg-brand-primary text-brand-secondary font-black text-xs uppercase tracking-widest"
                >
                  {createReturnMutation.isPending ? "Submitting..." : "Create Pending Return"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DataPanel>
    </div>
  );
}
