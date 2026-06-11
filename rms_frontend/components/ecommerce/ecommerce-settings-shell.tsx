"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Settings2, Store } from "lucide-react";

import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";
import { ecommerceSettingsSections } from "@/components/ecommerce/settings-navigation";

export function EcommerceSettingsShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { hasPermission } = useAuth();

  const visibleSections = ecommerceSettingsSections.filter(
    (section) => !section.permission || hasPermission(section.permission),
  );

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6">
      <section className="relative overflow-hidden rounded-[28px] border border-slate-200/80 bg-slate-950 px-5 py-6 text-white shadow-xl shadow-slate-950/10 sm:px-7">
        <div className="absolute -right-16 -top-24 h-64 w-64 rounded-full bg-emerald-400/15 blur-3xl" />
        <div className="absolute bottom-0 right-1/3 h-32 w-32 rounded-full bg-sky-400/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
              <Settings2 className="h-5 w-5 text-emerald-300" />
            </span>
            <div>
              <div className="mb-1 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-300">
                <Store className="h-3.5 w-3.5" />
                Storefront control center
              </div>
              <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Ecommerce settings</h1>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-300">
                Manage how your online store looks, sells, promotes, and delivers from one place.
              </p>
            </div>
          </div>

          <Link
            href="/"
            className="inline-flex h-10 w-fit items-center gap-2 rounded-xl bg-white px-4 text-xs font-bold text-slate-900 transition hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
          >
            View storefront
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <nav
        aria-label="Ecommerce settings sections"
        className="overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm"
      >
        <div className="flex min-w-max gap-1">
          {visibleSections.map((section) => {
            const Icon = section.icon;
            const isActive =
              section.href === "/ecommerce-settings"
                ? pathname === section.href
                : pathname.startsWith(section.href);

            return (
              <Link
                key={section.href}
                href={section.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex h-11 items-center gap-2 rounded-xl px-3.5 text-xs font-bold text-slate-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30",
                  isActive
                    ? "bg-brand-primary text-white shadow-md shadow-brand-primary/15"
                    : "hover:bg-slate-100 hover:text-slate-900",
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{section.shortTitle}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <div>{children}</div>
    </div>
  );
}
