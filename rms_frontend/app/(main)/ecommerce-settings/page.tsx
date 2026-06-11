"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, SlidersHorizontal } from "lucide-react";

import { useAuth } from "@/contexts/auth-context";
import { ecommerceSettingsSections } from "@/components/ecommerce/settings-navigation";

export default function EcommerceSettingsOverviewPage() {
  const { hasPermission } = useAuth();
  const sections = ecommerceSettingsSections
    .slice(1)
    .filter((section) => !section.permission || hasPermission(section.permission));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">Quick access</p>
          <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">What would you like to manage?</h2>
          <p className="mt-1 text-sm text-slate-500">Choose a section to update your live storefront settings.</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          {sections.length} sections available
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {sections.map((section) => {
          const Icon = section.icon;

          return (
            <Link
              key={section.href}
              href={section.href}
              className="group relative min-h-52 overflow-hidden rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30"
            >
              <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${section.accent}`} />
              <div className="flex items-start justify-between">
                <span className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg ${section.accent}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <ArrowRight className="h-5 w-5 text-slate-300 transition group-hover:translate-x-1 group-hover:text-slate-700" />
              </div>
              <h3 className="mt-7 text-lg font-black tracking-tight text-slate-950">{section.title}</h3>
              <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">{section.description}</p>
            </Link>
          );
        })}
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 text-sm text-emerald-950">
        <SlidersHorizontal className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
        Changes are made inside each section. Review previews and dates carefully before publishing customer-facing updates.
      </div>
    </div>
  );
}
