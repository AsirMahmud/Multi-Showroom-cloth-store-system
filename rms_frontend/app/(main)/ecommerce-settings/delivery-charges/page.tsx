"use client";

import { useEffect, useState } from "react";
import { PageHeader, DataPanel, MetricCard } from "@/components/ui/professional";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Truck, Save, MapPin, Navigation, Globe, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import axiosInstance from "@/lib/api/axios-config";
import { cn, formatCurrency } from "@/lib/utils";

interface DeliverySettings {
  inside_dhaka_charge: number;
  inside_gazipur_charge: number;
  outside_dhaka_charge: number;
  updated_at?: string;
}

// Framer motion variants
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

export default function DeliveryChargesSettingsPage() {
  const [inside, setInside] = useState<string>("");
  const [gazipur, setGazipur] = useState<string>("");
  const [outside, setOutside] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get("/ecommerce/delivery-settings/");
        const data: DeliverySettings = response.data;
        setInside(String(data.inside_dhaka_charge ?? "0"));
        setGazipur(String(data.inside_gazipur_charge ?? "0"));
        setOutside(String(data.outside_dhaka_charge ?? "0"));
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load delivery settings.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [toast]);

  const handleSave = async () => {
    if (!inside || !gazipur || !outside) {
      toast({
        title: "Validation Error",
        description: "Please enter all delivery charges.",
        variant: "destructive",
      });
      return;
    }

    const insideNum = parseFloat(inside);
    const gazipurNum = parseFloat(gazipur);
    const outsideNum = parseFloat(outside);

    if (isNaN(insideNum) || isNaN(gazipurNum) || isNaN(outsideNum) || insideNum < 0 || gazipurNum < 0 || outsideNum < 0) {
      toast({
        title: "Validation Error",
        description: "Please enter valid positive numbers.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      await axiosInstance.patch("/ecommerce/delivery-settings/", {
        inside_dhaka_charge: insideNum,
        inside_gazipur_charge: gazipurNum,
        outside_dhaka_charge: outsideNum,
      });

      toast({
        title: "Success",
        description: "Logistics updated successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.response?.data?.detail || "Failed to save delivery charges.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-[24px]" />
          ))}
        </div>
        <Skeleton className="h-[400px] rounded-[32px]" />
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
      <PageHeader
        title="Logistics & Delivery"
        description="Configure geographic delivery tariffs and regional fulfillment costs."
        icon={<Truck className="h-6 w-6" />}
        actions={
          <Button
            onClick={handleSave}
            disabled={saving}
            className="h-10 px-6 bg-brand-primary text-brand-secondary hover:bg-emerald-900 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-brand-primary/20"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save Manifest
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div variants={item}>
          <MetricCard
            label="Metropolitan"
            value={formatCurrency(parseFloat(inside) || 0)}
            icon={<MapPin className="h-5 w-5" />}
            tone="brand"
            helper="Inside Dhaka City"
          />
        </motion.div>
        <motion.div variants={item}>
          <MetricCard
            label="Satellite Zone"
            value={formatCurrency(parseFloat(gazipur) || 0)}
            icon={<Navigation className="h-5 w-5" />}
            tone="indigo"
            helper="Inside Gazipur Area"
          />
        </motion.div>
        <motion.div variants={item}>
          <MetricCard
            label="National"
            value={formatCurrency(parseFloat(outside) || 0)}
            icon={<Globe className="h-5 w-5" />}
            tone="emerald"
            helper="Outside Dhaka Division"
          />
        </motion.div>
      </div>

      <motion.div variants={item}>
        <DataPanel 
          title="Regional Tariffs" 
          description="Adjust shipping rates for various fulfillment zones."
        >
          <div className="grid gap-8 md:grid-cols-3">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Inside Dhaka (৳)</Label>
              <div className="relative">
                <Input
                  type="number"
                  value={inside}
                  onChange={(e) => setInside(e.target.value)}
                  className="h-12 rounded-xl bg-slate-50 border-none font-black text-lg pl-10"
                />
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
              </div>
              <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Primary metro coverage</p>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Gazipur Hub (৳)</Label>
              <div className="relative">
                <Input
                  type="number"
                  value={gazipur}
                  onChange={(e) => setGazipur(e.target.value)}
                  className="h-12 rounded-xl bg-slate-50 border-none font-black text-lg pl-10"
                />
                <Navigation className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
              </div>
              <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Strategic industrial zone</p>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Remote/National (৳)</Label>
              <div className="relative">
                <Input
                  type="number"
                  value={outside}
                  onChange={(e) => setOutside(e.target.value)}
                  className="h-12 rounded-xl bg-slate-50 border-none font-black text-lg pl-10"
                />
                <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
              </div>
              <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Extended domestic network</p>
            </div>
          </div>
        </DataPanel>
      </motion.div>
    </motion.div>
  );
}