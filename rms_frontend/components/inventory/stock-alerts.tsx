import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { AlertTriangle, Package, TrendingDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useStockAlerts } from "@/hooks/queries/useInventory";
import { DataPanel } from "@/components/ui/professional";
import { cn } from "@/lib/utils";
import React from "react";

interface StockAlert {
  id: string;
  name: string;
  quantity: number;
}

interface AlertItem {
  id: string;
  name: string;
  stock_quantity?: number;
}

interface AlertsData {
  low_stock?: AlertItem[];
  out_of_stock?: AlertItem[];
}

export function StockAlerts() {
  const { data: alertsData, isLoading } = useStockAlerts();

  // Transform and combine alerts data
  const alerts: StockAlert[] = React.useMemo(() => {
    if (!alertsData) return [];

    // Combine low stock and out of stock items
    const lowStock = ((alertsData as AlertsData).low_stock || []).map(
      (item: AlertItem) => ({
        id: item.id,
        name: item.name,
        quantity: item.stock_quantity || 0,
      })
    );

    const outOfStock = ((alertsData as AlertsData).out_of_stock || []).map(
      (item: AlertItem) => ({
        id: item.id,
        name: item.name,
        quantity: 0,
      })
    );

    return [...lowStock, ...outOfStock];
  }, [alertsData]);

  if (isLoading) {
    return (
      <div className="w-full h-[400px] rounded-[32px] bg-slate-100 animate-pulse" />
    );
  }

  return (
    <DataPanel 
      title="Global Stock Vigilance" 
      description="Identifying high-risk nodes requiring immediate replenishment."
      actions={
        <Badge className="bg-rose-50 text-rose-600 border-none font-black text-[10px] uppercase tracking-widest px-3 py-1">
          {alerts.length} Critical Vectors
        </Badge>
      }
    >
      <ScrollArea className="h-[350px] pr-4 -mx-2">
        <div className="space-y-3 px-2">
          {alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-300">
              <Package className="h-12 w-12 mb-4 opacity-10" />
              <p className="text-sm font-black uppercase tracking-widest">Network integrity secured</p>
            </div>
          ) : (
            alerts.map((alert) => (
              <div
                key={alert.id}
                className="group flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-100 hover:shadow-lg transition-all duration-300"
              >
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                  alert.quantity === 0 ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600"
                )}>
                  {alert.quantity === 0 ? (
                    <TrendingDown className="h-5 w-5" />
                  ) : (
                    <AlertTriangle className="h-5 w-5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-slate-900 truncate tracking-tight">
                    {alert.name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className={cn(
                      "text-[10px] font-bold uppercase tracking-widest",
                      alert.quantity === 0 ? "text-rose-500" : "text-amber-600"
                    )}>
                      {alert.quantity === 0
                        ? "Node depleted"
                        : `${alert.quantity} units remaining`}
                    </p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    "border-none font-black text-[9px] uppercase tracking-widest",
                    alert.quantity === 0 ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600"
                  )}
                >
                  {alert.quantity === 0 ? "Critical" : "Warning"}
                </Badge>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </DataPanel>
  );
}
