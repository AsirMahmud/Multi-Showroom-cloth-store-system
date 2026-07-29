"use client";

import { useTheme } from "next-themes";
import { useColor, ColorPreset } from "@/contexts/color-context";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Sun, Moon, Monitor, Check } from "lucide-react";
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
  const { theme, setTheme } = useTheme();
  const { preset, setPreset } = useColor();

  return (
    <div className="space-y-8">
      {/* Mode Selection */}
      <div className="space-y-4">
        <div className="space-y-1">
          <Label className="text-[10px] font-black uppercase tracking-widest text-brand-primary">Interface Mode</Label>
          <p className="text-[11px] font-medium text-slate-400">Select your preferred lighting environment.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { id: "light", icon: Sun, label: "Light" },
            { id: "dark", icon: Moon, label: "Dark" },
            { id: "system", icon: Monitor, label: "System" },
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => setTheme(mode.id)}
              className={cn(
                "group relative flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border transition-all duration-300",
                theme === mode.id 
                  ? "bg-white border-brand-primary/20 shadow-xl shadow-brand-primary/5 ring-1 ring-brand-primary/10" 
                  : "bg-slate-50 border-transparent hover:bg-white hover:border-slate-200"
              )}
            >
              <div className={cn(
                "h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-300",
                theme === mode.id ? "bg-brand-primary text-white scale-110" : "bg-white text-slate-400 group-hover:text-brand-primary"
              )}>
                <mode.icon className="h-5 w-5" />
              </div>
              <span className={cn(
                "text-[10px] font-black uppercase tracking-widest transition-colors",
                theme === mode.id ? "text-brand-primary" : "text-slate-400 group-hover:text-slate-600"
              )}>
                {mode.label}
              </span>
              {theme === mode.id && (
                <motion.div 
                  layoutId="mode-active"
                  className="absolute -top-1 -right-1 h-5 w-5 bg-brand-accent rounded-full flex items-center justify-center text-white shadow-lg"
                >
                  <Check className="h-3 w-3 stroke-[4]" />
                </motion.div>
              )}
            </button>
          ))}
        </div>
      </div>

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
