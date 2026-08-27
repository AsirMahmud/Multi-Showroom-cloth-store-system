"use client";

import { useTheme } from "next-themes";
import { useColor, ColorPreset } from "@/contexts/color-context";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const presets: { id: ColorPreset; name: string; color: string }[] = [
  { id: "emerald", name: "Emerald", color: "bg-emerald-500" },
  { id: "blue", name: "Sapphire", color: "bg-blue-600" },
  { id: "indigo", name: "Indigo", color: "bg-indigo-600" },
  { id: "violet", name: "Amethyst", color: "bg-violet-600" },
  { id: "rose", name: "Ruby", color: "bg-rose-500" },
  { id: "crimson", name: "Crimson", color: "bg-crimson-600" },
  { id: "orange", name: "Amber", color: "bg-orange-500" },
  { id: "amber", name: "Gold", color: "bg-amber-500" },
  { id: "cyan", name: "Cyan", color: "bg-cyan-500" },
  { id: "slate", name: "Slate", color: "bg-slate-600" },
];

export function AppearanceSettings() {
  const { preset, setPreset } = useColor();

  return (
    <div className="space-y-8">

      {/* Color Presets */}
      <div className="space-y-4">
        <div className="space-y-1">
          <Label className="text-[10px] font-black uppercase tracking-widest text-brand-primary">Brand Palette</Label>
          <p className="text-[11px] font-medium text-slate-400">Choose a signature color for your workspace.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {presets.map((p) => (
            <button
              key={p.id}
              onClick={() => setPreset(p.id)}
              className={cn(
                "group relative flex flex-col items-center gap-2 transition-all duration-300",
                "hover:scale-105 active:scale-95"
              )}
            >
              <div className={cn(
                "h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-sm",
                p.color,
                preset === p.id ? "ring-4 ring-offset-2 ring-brand-primary/20 scale-110 shadow-lg" : "opacity-80 hover:opacity-100"
              )}>
                {preset === p.id && <Check className="h-6 w-6 text-white stroke-[3]" />}
              </div>
              <span className={cn(
                "text-[9px] font-bold uppercase tracking-tight transition-colors",
                preset === p.id ? "text-brand-primary" : "text-slate-400 group-hover:text-slate-600"
              )}>
                {p.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
