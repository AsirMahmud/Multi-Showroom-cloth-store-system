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

const ALL_BRANCHES_GRADIENT =
  "from-[#163625] via-[#1a4d35] to-[#163625]";
const BRANCH_GRADIENT =
  "from-[#163625] via-[#224f3a] to-[#1a4331]";

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
            className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-lg px-2.5 py-2"
          >
            <div className="flex items-center gap-2 text-white/80 text-[11px] uppercase tracking-wide font-medium">
              <Icon className="h-3.5 w-3.5" />
              {item.label}
            </div>
            <div className="mt-1 font-semibold text-white text-base leading-tight tabular-nums">
              {loading ? (
                <Skeleton className="h-4 w-16 bg-white/30" />
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
        "group relative w-full text-left overflow-hidden rounded-2xl",
        "bg-gradient-to-br shadow-md border border-[#163625]/20",
        "transition-all duration-300 ease-out",
        "hover:-translate-y-1 hover:shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#163625] focus-visible:ring-offset-2",
        gradient,
        selected && "ring-2 ring-[#163625] ring-offset-2 ring-offset-white shadow-xl"
      )}
    >
      {/* decorative blob */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute -left-12 -bottom-12 h-40 w-40 rounded-full bg-white/5 blur-2xl" />

      <div className="relative p-4 text-white">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-11 w-11 shrink-0 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm border border-white/20">
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="text-base font-semibold leading-tight truncate">
                {name}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-white/80 mt-0.5">
                <MapPin className="h-3 w-3" />
                <span className="truncate">
                  {variant === "all"
                    ? "Aggregate view across all branches"
                    : address?.trim() || "No address provided"}
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            {variant === "branch" && (
              <Badge
                variant="secondary"
                className={cn(
                  "border-0 text-[10px] uppercase tracking-wider font-semibold",
                  active
                    ? "bg-emerald-400/20 text-emerald-50 border border-emerald-200/30"
                    : "bg-rose-400/20 text-rose-50 border border-rose-200/30"
                )}
              >
                {active ? "Active" : "Inactive"}
              </Badge>
            )}
            {selected && (
              <Badge className="bg-[#E4FCD5] text-[#163625] hover:bg-[#d8f5c8] border-0 text-[10px] uppercase tracking-wider font-bold">
                Active Branch
              </Badge>
            )}
          </div>
        </div>

        {!hideKpis && (
          <KpiStrip data={data} loading={isLoading} variant={variant} />
        )}

        <div className="mt-3 flex items-center justify-between text-xs text-white/85">
          <span className="font-medium">
            {variant === "all" ? "View consolidated data" : "Open this branch"}
          </span>
          <span className="inline-flex items-center gap-1 font-semibold opacity-90 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">
            {isLoading && !hideKpis ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <ArrowRight className="h-3.5 w-3.5" />
            )}
            <span>Select</span>
          </span>
        </div>
      </div>
    </button>
  );
}

export default BranchCard;
