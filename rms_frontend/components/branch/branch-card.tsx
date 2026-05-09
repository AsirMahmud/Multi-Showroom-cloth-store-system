"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Building2,
  Globe2,
  Loader2,
  MapPin,
  Package,
  Receipt,
  Users,
  Wallet,
} from "lucide-react";

import { branchesApi, type BranchSummary } from "@/lib/api/branches";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type BranchCardProps = {
  variant?: "branch" | "all";
  branchId?: number | null;
  name: string;
  address?: string | null;
  active?: boolean;
  selected?: boolean;
  onSelect?: () => void;
  /**
   * Hide the KPI strip (used in dense lists where the strip would be too noisy).
   */
  hideKpis?: boolean;
};

const taka = (value: number | string | null | undefined) => {
  const n = Number(value ?? 0);
  if (Number.isNaN(n)) return "৳0";
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(n);
};

const ALL_BRANCHES_GRADIENT = "bg-white";
const BRANCH_GRADIENT = "bg-white";

function KpiStrip({
  data,
  loading,
  variant,
}: {
  data?: BranchSummary | null;
  loading: boolean;
  variant: "branch" | "all";
}) {
  const items = [
    {
      label: "Today's Sales",
      value: data ? taka(data.today_sales) : null,
      icon: Receipt,
    },
    {
      label: "Open Dues",
      value: data ? taka(data.open_dues) : null,
      icon: Wallet,
    },
    {
      label: variant === "all" ? "Products" : "In Stock",
      value:
        data?.products_in_stock != null
          ? Number(data.products_in_stock).toLocaleString()
          : null,
      icon: Package,
    },
    {
      label: "Staff",
      value:
        data?.staff_count != null
          ? Number(data.staff_count).toLocaleString()
          : null,
      icon: Users,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 mt-4">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.label}
            className="bg-white border border-slate-100 rounded-xl px-3 py-2 group/kpi hover:bg-brand-secondary/30 transition-colors"
          >
            <div className="flex items-center gap-1.5 text-slate-400 text-[9px] uppercase tracking-widest font-black">
              <Icon className="h-3 w-3 text-brand-primary/30 group-hover/kpi:text-brand-primary transition-colors" />
              {item.label}
            </div>
            <div className="mt-0.5 font-black text-brand-primary text-sm leading-tight tabular-nums">
              {loading ? (
                <Skeleton className="h-3.5 w-12 bg-slate-100" />
              ) : (
                item.value ?? "—"
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function BranchCard({
  variant = "branch",
  branchId = null,
  name,
  address,
  active = true,
  selected = false,
  onSelect,
  hideKpis = false,
}: BranchCardProps) {
  const queryKey =
    variant === "all"
      ? ["branch-summary", "all"]
      : ["branch-summary", branchId];

  const { data, isLoading } = useQuery<BranchSummary | null>({
    queryKey,
    queryFn: () => branchesApi.getBranchSummary(branchId ?? null),
    enabled: !hideKpis,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: 0,
  });

  const Icon = variant === "all" ? Globe2 : Building2;
  const gradient =
    variant === "all" ? ALL_BRANCHES_GRADIENT : BRANCH_GRADIENT;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "group relative w-full text-left overflow-hidden rounded-[24px]",
        "transition-all duration-500 ease-out",
        "hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2",
        selected 
          ? "bg-white ring-2 ring-brand-primary shadow-[0_20px_40px_-12px_rgba(22,54,37,0.1)] z-10" 
          : "bg-slate-50/80 border border-slate-200 hover:bg-white hover:border-brand-primary/30 hover:shadow-lg"
      )}
    >
      {/* subtle decorative background */}
      <div className="absolute top-0 right-0 p-6 opacity-[0.02] group-hover:opacity-[0.04] transition-opacity pointer-events-none">
        <Icon className="w-24 h-24 rotate-12" />
      </div>

      <div className="relative p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={cn(
              "h-11 w-11 shrink-0 rounded-xl flex items-center justify-center transition-all duration-500 group-hover:scale-105",
              selected ? "bg-brand-primary text-brand-secondary shadow-lg shadow-brand-primary/10" : "bg-white text-slate-300 border border-slate-100 group-hover:border-brand-primary/20 group-hover:text-brand-primary"
            )}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-black leading-tight text-brand-primary truncate">
                {name}
              </div>
              <div className="flex items-center gap-1 text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                <MapPin className="h-2.5 w-2.5 text-brand-primary/20" />
                <span className="truncate">
                  {variant === "all"
                    ? "Aggregate view"
                    : address?.trim() || "Location not set"}
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            {selected && (
              <Badge className="bg-brand-primary text-brand-secondary hover:bg-brand-primary border-0 text-[8px] uppercase tracking-widest font-black px-2 py-0.5 shadow-sm">
                Active
              </Badge>
            )}
          </div>
        </div>

        {!hideKpis && (
          <KpiStrip data={data} loading={isLoading} variant={variant} />
        )}

        <div className="mt-4 pt-3 border-t border-slate-200/50 flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-slate-400">
          <span className="group-hover:text-brand-primary transition-colors">
            {variant === "all" ? "Organization" : "Branch"}
          </span>
          <span className="inline-flex items-center gap-1 text-brand-primary group-hover:translate-x-0.5 transition-transform">
            {isLoading && !hideKpis ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <ArrowRight className="h-3 w-3" />
            )}
            <span>Activate</span>
          </span>
        </div>
      </div>
    </button>
  );
}

export default BranchCard;
