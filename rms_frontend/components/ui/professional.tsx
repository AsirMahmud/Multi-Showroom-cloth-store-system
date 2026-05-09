"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowUpRight, Search } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

type Tone = "brand" | "emerald" | "amber" | "rose" | "slate" | "blue";

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

export function TableShell({
  children,
  isLoading,
  emptyMessage,
  emptyIcon,
  colSpan = 1,
}: {
  children: ReactNode;
  isLoading?: boolean;
  emptyMessage?: string;
  emptyIcon?: ReactNode;
  colSpan?: number;
}) {
  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-lg border border-emerald-900/10 bg-white">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="border-b border-emerald-900/10 p-4 last:border-0">
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
      </div>
    );
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

