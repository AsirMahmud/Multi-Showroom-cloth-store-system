"use client";

import { motion } from "framer-motion";
import { DataPanel } from "@/components/ui/professional";
import { 
  Zap, 
  Clock, 
  AlertTriangle, 
  ArrowUpRight,
  Package,
  Activity
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

interface InventoryIntelligenceProps {
  data: {
    velocity: any[]; // { name, rate }
    deadStock: any[]; // { name, daysSinceLastSale }
    stockValueByCategory: any[];
  };
}

export function InventoryIntelligence({ data }: InventoryIntelligenceProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <motion.div variants={item}>
        <DataPanel 
          title="Sales Velocity" 
          description="Average units sold per day for top products."
          actions={<Zap className="h-4 w-4 text-amber-500" />}
        >
          <div className="space-y-4 pt-4">
            {data.velocity.map((product, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-brand-primary/20 transition-all group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm text-[10px] font-black text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-colors">
                    {index + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-700 truncate">{product.name}</p>
                    <p className="text-[10px] text-slate-400 font-medium">{product.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-emerald-600 font-black text-xs">
                    <ArrowUpRight className="h-3 w-3" />
                    {product.rate} <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">units/day</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DataPanel>
      </motion.div>

      <motion.div variants={item}>
        <DataPanel 
          title="Low Movement Alert" 
          description="Items with no sales activity in the last 30+ days."
          actions={<Clock className="h-4 w-4 text-rose-500" />}
        >
          <div className="space-y-4 pt-4">
            {data.deadStock.length > 0 ? (
              data.deadStock.map((product, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-rose-50/30 rounded-xl border border-rose-100/30 hover:bg-rose-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-rose-100 text-rose-600 rounded-lg flex items-center justify-center">
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-700 truncate">{product.name}</p>
                      <p className="text-[10px] text-rose-500 font-medium">Inactive for {product.daysSinceLastSale} days</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-rose-200 text-rose-600">
                    Stock: {product.stock}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <Activity className="h-10 w-10 mb-2 opacity-20" />
                <p className="text-sm">All inventory is moving well</p>
              </div>
            )}
          </div>
        </DataPanel>
      </motion.div>
    </div>
  );
}
