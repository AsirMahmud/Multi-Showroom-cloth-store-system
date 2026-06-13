"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowUpRight, Search } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

type Tone = "brand" | "emerald" | "amber" | "rose" | "slate" | "blue" | "indigo" | "violet";

const toneStyles: Record<Tone, { icon: string; badge: string; border: string }> = {
  brand: {
    icon: "bg-brand-primary text-brand-secondary",
    badge: "border-brand-primary/10 bg-brand-secondary/50 text-brand-primary",
    border: "border-l-brand-primary",
  },
  emerald: {
    icon: "bg-emerald-100 text-emerald-700",
    badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
    border: "border-l-emerald-500",
  },
  amber: {
    icon: "bg-amber-100 text-amber-700",
    badge: "border-amber-200 bg-amber-50 text-amber-700",
    border: "border-l-amber-500",
  },
  rose: {
    icon: "bg-rose-100 text-rose-700",
    badge: "border-rose-200 bg-rose-50 text-rose-700",
    border: "border-l-rose-500",
  },
  slate: {
    icon: "bg-slate-100 text-slate-700",
    badge: "border-slate-200 bg-slate-50 text-slate-700",
    border: "border-l-slate-400",
  },
  blue: {
    icon: "bg-sky-100 text-sky-700",
    badge: "border-sky-200 bg-sky-50 text-sky-700",
    border: "border-l-sky-500",
  },
  indigo: {
    icon: "bg-indigo-100 text-indigo-700",
    badge: "border-indigo-200 bg-indigo-50 text-indigo-700",
    border: "border-l-indigo-500",
  },
  violet: {
    icon: "bg-violet-100 text-violet-700",
    badge: "border-violet-200 bg-violet-50 text-violet-700",
    border: "border-l-violet-500",
  },
};

export function PageHeader({
  title,
  description,
  icon,
  actions,
  meta,
  className,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  meta?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-4 md:flex-row md:items-start md:justify-between", className)}>
      <div className="flex min-w-0 items-start gap-3">
        {icon ? (
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-primary text-brand-secondary shadow-premium animate-float">
            {icon}
          </span>
        ) : null}
        <div className="min-w-0">
          {meta ? <div className="mb-2 flex flex-wrap items-center gap-2">{meta}</div> : null}
          <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-brand-primary via-brand-primary to-emerald-800 bg-clip-text text-transparent md:text-3xl leading-tight">
            {title}
          </h1>
          {description ? <p className="mt-1 max-w-3xl text-sm text-slate-500 font-medium leading-relaxed">{description}</p> : null}
        </div>
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function MetricCard({
  label,
  value,
  helper,
  icon,
  tone = "brand",
  href,
  isLoading,
}: {
  label: string;
  value: ReactNode;
  helper?: ReactNode;
  icon?: ReactNode;
  tone?: Tone;
  href?: string;
  isLoading?: boolean;
}) {
  const content = (
    <Card className={cn("h-full border-0 shadow-xl bg-white/90 backdrop-blur-md transition-all duration-300 hover:shadow-premium hover:-translate-y-1.5 group overflow-hidden", toneStyles[tone].border, "border-l-[6px]")}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
            {isLoading ? (
              <Skeleton className="mt-2 h-6 w-16" />
            ) : (
              <div className="mt-1 truncate text-xl font-black text-slate-950 tracking-tight">{value}</div>
            )}
            {helper ? <p className="mt-1 text-[10px] text-slate-400 font-medium">{helper}</p> : null}
          </div>
          {icon ? (
            <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", toneStyles[tone].icon)}>
              {icon}
            </span>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );

  return href ? (
    <Link href={href} className="group block h-full">
      {content}
    </Link>
  ) : (
    content
  );
}

export function DataPanel({
  title,
  description,
  actions,
  children,
  className,
  contentClassName,
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <Card className={cn("bg-white shadow-premium border-0 overflow-hidden", className)}>
      {(title || description || actions) && (
        <CardHeader className="flex flex-col gap-3 border-b border-brand-primary/5 bg-slate-50/30 md:flex-row md:items-center md:justify-between px-6 py-6">
          <div>
            {title ? <CardTitle className="text-2xl font-bold text-brand-primary tracking-tight">{title}</CardTitle> : null}
            {description ? <CardDescription className="mt-1.5 text-slate-500/80 font-medium">{description}</CardDescription> : null}
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </CardHeader>
      )}
      <CardContent className={cn("p-6", contentClassName)}>
        {children}
      </CardContent>
    </Card>
  );
}

export function FilterToolbar({
  search,
  searchPlaceholder = "Search...",
  onSearchChange,
  actions,
  children,
  className,
}: {
  search?: string;
  searchPlaceholder?: string;
  onSearchChange?: (value: string) => void;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-3 rounded-lg border border-emerald-900/10 bg-white p-3 md:flex-row md:items-center md:justify-between", className)}>
      <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center">
        {onSearchChange ? (
          <div className="relative w-full md:max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              value={search ?? ""}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder={searchPlaceholder}
              className="pl-9"
            />
          </div>
        ) : null}
        {children}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function StatusBadge({
  label,
  tone = "slate",
  className,
}: {
  label: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <Badge variant="outline" className={cn("gap-1 rounded-full font-semibold", toneStyles[tone].badge, className)}>
      {label}
    </Badge>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="w-full space-y-4 animate-pulse">
      <div className="flex items-center justify-between py-2 px-1">
        <div className="space-y-2">
          <Skeleton className="h-6 w-[240px] rounded-lg" />
          <Skeleton className="h-3 w-[160px] rounded-lg opacity-50" />
        </div>
        <Skeleton className="h-10 w-[120px] rounded-xl" />
      </div>
      <div className="rounded-[32px] border border-brand-primary/5 overflow-hidden bg-white shadow-premium">
        <div className="bg-slate-50/50 p-6 border-b border-brand-primary/5">
          <div className="flex gap-6">
            {Array.from({ length: cols }).map((_, i) => (
              <Skeleton key={i} className="h-3 flex-1 rounded-full bg-slate-200" />
            ))}
          </div>
        </div>
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="p-6 border-b border-brand-primary/[0.02] last:border-0">
            <div className="flex gap-6 items-center">
              {Array.from({ length: cols }).map((_, i) => (
                <Skeleton key={i} className="h-4 flex-1 rounded-lg bg-slate-100" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: {
  title: string;
  description: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-16 text-center border-2 border-dashed border-slate-100 rounded-[40px] bg-slate-50/40 backdrop-blur-sm", className)}>
      {icon && (
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-white text-brand-primary/20 shadow-premium ring-1 ring-brand-primary/5 animate-float">
          {icon}
        </div>
      )}
      <h3 className="text-xl font-black text-brand-primary uppercase tracking-tight">{title}</h3>
      <p className="mt-3 text-sm font-bold text-slate-400 max-w-[320px] leading-relaxed uppercase tracking-wide">{description}</p>
      {action && <div className="mt-8">{action}</div>}
    </div>
  );
}

export function GridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="rounded-[32px] border-slate-100 overflow-hidden bg-white/50 shadow-sm">
          <Skeleton className="aspect-square w-full" />
          <div className="p-5 space-y-3">
            <Skeleton className="h-4 w-3/4 rounded-lg" />
            <Skeleton className="h-3 w-1/2 rounded-lg" />
            <div className="flex justify-between pt-2">
              <Skeleton className="h-5 w-16 rounded-lg" />
              <Skeleton className="h-8 w-24 rounded-xl" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="w-full space-y-6">
      <div className="flex items-end gap-3 h-[300px] pt-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton 
            key={i} 
            className="flex-1 rounded-t-xl bg-slate-100/50" 
            style={{ height: `${Math.floor(Math.random() * 60) + 20}%` }} 
          />
        ))}
      </div>
      <div className="flex justify-between">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-12 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export function TableShell({
  children,
  isLoading,
  emptyMessage,
  emptyIcon,
  colSpan = 4,
}: {
  children: ReactNode;
  isLoading?: boolean;
  emptyMessage?: string;
  emptyIcon?: ReactNode;
  colSpan?: number;
}) {
  if (isLoading) {
    return <TableSkeleton cols={colSpan} />;
  }

  if (emptyMessage) {
    return (
      <div className="rounded-lg border border-dashed border-emerald-900/15 bg-white p-10 text-center text-sm text-slate-500">
        {emptyIcon ? <div className="mx-auto mb-3 flex justify-center text-slate-300">{emptyIcon}</div> : null}
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-emerald-900/10 bg-white">
      {children}
    </div>
  );
}

export function ActionCard({
  title,
  description,
  icon,
  href,
}: {
  title: string;
  description: string;
  icon?: ReactNode;
  href: string;
}) {
  return (
    <Link href={href} className="group block h-full">
      <Card className="h-full bg-white/80 backdrop-blur-sm transition-all hover:shadow-premium hover:-translate-y-1 border-brand-primary/5">
        <CardContent className="flex h-full items-start gap-4 p-6">
          {icon ? (
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-secondary text-brand-primary group-hover:scale-110 transition-transform shadow-sm">
              {icon}
            </span>
          ) : null}
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-bold text-brand-primary">{title}</h3>
              <ArrowUpRight className="h-5 w-5 shrink-0 text-brand-primary/20 transition-all group-hover:text-brand-primary group-hover:translate-x-1 group-hover:-translate-y-1" />
            </div>
            <p className="mt-1 text-sm text-slate-500/80 leading-relaxed">{description}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

/**
 * Standard Dashboard Shell with Sidebar and Navigation
 */
export function DashboardShell({ 
  children,
  sidebar,
  navbar,
}: { 
  children: ReactNode;
  sidebar: ReactNode;
  navbar: ReactNode;
}) {
  return (
    <div className="flex min-h-screen selection:bg-brand-secondary selection:text-brand-primary">
      <div className="fixed inset-y-0 z-50">
        {sidebar}
      </div>
      <div className="flex-1 flex flex-col min-w-0 md:ml-[280px]">
        {navbar}
        <main className="flex-1 p-4 md:p-8 transition-all duration-500">
          {children}
        </main>
      </div>
    </div>
  );
}

