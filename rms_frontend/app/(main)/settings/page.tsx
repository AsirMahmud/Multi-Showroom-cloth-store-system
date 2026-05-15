"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader, DataPanel } from "@/components/ui/professional";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useFlushDatabase } from "@/hooks/queries/use-settings";
import { useBismillah } from "@/contexts/bismillah-context";
import { useBranch } from "@/contexts/branch-context";
import { AppearanceSettings } from "@/components/settings/appearance-settings";
import { wholesaleSettingsApi } from "@/lib/api/inventory";
import { branchesApi } from "@/lib/api/branches";
import { resolveReceiptSettings } from "@/lib/receipt-settings";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Save, Tags, Trash2, Settings, ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";

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

const databaseOptions = [
  { id: "sales", label: "Sales Database" },
  { id: "customers", label: "Customers Database" },
  { id: "expenses", label: "Expenses Database" },
  { id: "reports", label: "Reports Database" },
];

export default function SettingsPage() {
  const [selectedDatabase, setSelectedDatabase] = useState<string | null>(null);
  const { mutate: flushDatabase, isPending } = useFlushDatabase();
  const { showBismillah, toggleBismillah } = useBismillah();

  const handleFlushDatabase = () => {
    if (selectedDatabase) {
      flushDatabase(selectedDatabase);
    }
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      <PageHeader
        title="System Orchestration"
        description="Global aesthetics, security protocols, and database lifecycle management."
        icon={<Settings className="h-6 w-6" />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div variants={item} className="space-y-8">
          <DataPanel 
            title="Appearance & Aesthetics" 
            description="Manage global UI mode and brand color presets."
          >
            <AppearanceSettings />
            
            <div className="mt-8 pt-6 border-t border-slate-100">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-brand-primary/5 transition-all hover:bg-white hover:shadow-lg">
                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-brand-primary">Bismillah Protocol</Label>
                  <p className="text-[11px] font-medium text-slate-400">
                    Toggle symbolic identifier in navigation stream.
                  </p>
                </div>
                <Switch checked={showBismillah} onCheckedChange={toggleBismillah} />
              </div>
            </div>
          </DataPanel>

          <DataPanel 
            title="Security & Auth" 
            description="Manage session protocols and access vectors."
          >
            <div className="p-4 bg-slate-50 rounded-2xl border border-brand-primary/5 opacity-50 grayscale cursor-not-allowed">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Multi-Factor Entry</Label>
                  <p className="text-[11px] font-medium text-slate-400">Locked in demonstration cycle.</p>
                </div>
                <Switch disabled />
              </div>
            </div>
          </DataPanel>

          <WholesalePricingSettingsPanel />
          <ReceiptSettingsPanel />
        </motion.div>

        <motion.div variants={item} className="space-y-8">
          <DataPanel 
            title="Database Orchestration" 
            description="Precise data segment purging and cache cleaning."
          >
            <div className="space-y-3">
              {databaseOptions.map((option) => (
                <div
                  key={option.id}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-brand-primary/5 transition-all hover:bg-white hover:shadow-lg"
                >
                  <div>
                    <h3 className="text-[11px] font-black uppercase tracking-widest text-brand-primary">{option.label}</h3>
                    <p className="text-[10px] font-medium text-slate-400">
                      Purge all {option.label.toLowerCase()} nodes.
                    </p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedDatabase(option.id)}
                        className="h-8 px-3 rounded-lg font-black text-[9px] uppercase tracking-widest border-rose-100 text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                      >
                        Purge
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-[32px] border-none shadow-2xl">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-black text-brand-primary">Terminal Action</AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-500 font-medium">
                          You are about to wipe the {option.label.toLowerCase()}. This is irreversible.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl font-bold">Abort</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleFlushDatabase}
                          disabled={isPending}
                          className="bg-rose-500 hover:bg-rose-600 rounded-xl font-bold"
                        >
                          {isPending ? "Clearing..." : "Execute Wipe"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          </DataPanel>
        </motion.div>
      </div>

      <motion.div variants={item}>
        <DataPanel 
          title="Terminal Risk Zone" 
          description="High-impact system resets and global data deletion."
        >
          <div className="p-6 border-2 border-rose-100 bg-rose-50/30 rounded-[32px] flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-500 shrink-0">
                <ShieldAlert className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-rose-600">Total System Reset</h3>
                <p className="text-[11px] font-medium text-slate-500 max-w-md mt-1">
                  Wipe all operational data streams including sales, customers, and financial reports. 
                  Admin credentials and core configuration will remain intact.
                </p>
              </div>
            </div>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  onClick={() => setSelectedDatabase("all")}
                  className="h-12 px-8 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-rose-500/20 bg-rose-500 hover:bg-rose-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Reset Everything
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-[32px] border-none shadow-2xl">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-xl font-black text-rose-600">Nuclear Warning</AlertDialogTitle>
                  <AlertDialogDescription className="text-slate-500 font-medium">
                    This will permanently delete the entire operational history of this branch.
                    <div className="mt-4 p-4 bg-rose-50 rounded-2xl border border-rose-100">
                      <ul className="space-y-1 text-[11px] font-bold text-rose-700 uppercase tracking-tight">
                        <li>• Complete Sales History</li>
                        <li>• Entire Customer Database</li>
                        <li>• All Liability Records</li>
                        <li>• All Aggregated Analytics</li>
                      </ul>
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-xl font-bold">Disarm</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleFlushDatabase}
                    disabled={isPending}
                    className="bg-rose-600 hover:bg-rose-700 rounded-xl font-bold"
                  >
                    {isPending ? "Resetting..." : "Confirm Nuclear Strike"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </DataPanel>
      </motion.div>
    </motion.div>
  )
}

function WholesalePricingSettingsPanel() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [cutoff, setCutoff] = useState("10");

  const { data, isLoading } = useQuery({
    queryKey: ["wholesale-pricing-settings"],
    queryFn: wholesaleSettingsApi.get,
  });

  useEffect(() => {
    if (data?.global_wholesale_cutoff) {
      setCutoff(String(data.global_wholesale_cutoff));
    }
  }, [data?.global_wholesale_cutoff]);

  const saveSettings = useMutation({
    mutationFn: () =>
      wholesaleSettingsApi.update({
        global_wholesale_cutoff: Math.max(1, Number(cutoff) || 1),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wholesale-pricing-settings"] });
      toast({
        title: "Pricing rule saved",
        description: "Global wholesale quantity limit has been updated.",
      });
    },
    onError: () => {
      toast({
        title: "Unable to save pricing rule",
        description: "Please check your permission or try again.",
        variant: "destructive",
      });
    },
  });

  return (
    <DataPanel
      title="Pricing Rules"
      description="Set the default quantity where POS switches from retail to wholesale pricing."
    >
      <div className="space-y-5">
        <div className="flex items-start gap-4 rounded-2xl border border-brand-primary/5 bg-slate-50 p-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-primary text-brand-secondary">
            <Tags className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <Label className="text-[10px] font-black uppercase tracking-widest text-brand-primary">
              Global Wholesale Limit
            </Label>
            <p className="text-[11px] font-medium text-slate-400">
              Example: if this is 10, buying 10 or more pieces uses wholesale price unless product/category overrides it.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
          <Input
            type="number"
            min={1}
            value={cutoff}
            onChange={(e) => setCutoff(e.target.value)}
            disabled={isLoading || saveSettings.isPending}
            className="h-12 rounded-xl border-none bg-slate-50 font-bold text-brand-primary"
            placeholder="10"
          />
          <Button
            onClick={() => saveSettings.mutate()}
            disabled={isLoading || saveSettings.isPending || Number(cutoff) < 1}
            className="h-12 rounded-xl bg-brand-primary px-6 font-black text-brand-secondary hover:bg-emerald-900"
          >
            {saveSettings.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Rule
          </Button>
        </div>

        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
          Priority: product cutoff, then category cutoff, then this global cutoff.
        </p>
      </div>
    </DataPanel>
  );
}

function ReceiptSettingsPanel() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { selectedBranchId, availableBranches } = useBranch();
  const [form, setForm] = useState({
    receipt_header_title: "",
    receipt_header_subtitle: "",
    receipt_address: "",
    receipt_phone: "",
    receipt_footer_message: "",
    receipt_return_policy: "",
  });

  const selectedBranch = availableBranches.find((branch) => branch.id === selectedBranchId) ?? null;
  const { data: branchSettings, isLoading } = useQuery({
    queryKey: ["branch-receipt-settings", selectedBranchId],
    queryFn: () => branchesApi.getBranch(selectedBranchId as number),
    enabled: selectedBranchId !== null,
  });

  useEffect(() => {
    if (!branchSettings) return;
    setForm({
      receipt_header_title: branchSettings.receipt_header_title || "",
      receipt_header_subtitle: branchSettings.receipt_header_subtitle || "",
      receipt_address: branchSettings.receipt_address || "",
      receipt_phone: branchSettings.receipt_phone || "",
      receipt_footer_message: branchSettings.receipt_footer_message || "",
      receipt_return_policy: branchSettings.receipt_return_policy || "",
    });
  }, [branchSettings]);

  const saveSettings = useMutation({
    mutationFn: () =>
      branchesApi.updateBranch(selectedBranchId as number, {
        receipt_header_title: form.receipt_header_title.trim(),
        receipt_header_subtitle: form.receipt_header_subtitle.trim(),
        receipt_address: form.receipt_address.trim(),
        receipt_phone: form.receipt_phone.trim(),
        receipt_footer_message: form.receipt_footer_message.trim(),
        receipt_return_policy: form.receipt_return_policy.trim(),
      }),
    onSuccess: (updatedBranch) => {
      qc.invalidateQueries({ queryKey: ["branch-receipt-settings", selectedBranchId] });
      qc.invalidateQueries({ queryKey: ["branches"] });
      toast({
        title: "Receipt settings saved",
        description: `${updatedBranch.name} receipt branding has been updated.`,
      });
    },
    onError: () => {
      toast({
        title: "Unable to save receipt settings",
        description: "Please try again or check your branch access.",
        variant: "destructive",
      });
    },
  });

  if (selectedBranchId === null) {
    return (
      <DataPanel
        title="Receipt Settings"
        description="Receipt branding is managed per branch."
      >
        <div className="rounded-2xl border border-dashed border-brand-primary/10 bg-slate-50 p-5 text-sm text-slate-500">
          Select a branch first to edit its receipt header, footer, and thermal print layout text.
        </div>
      </DataPanel>
    );
  }

  const previewSettings = resolveReceiptSettings({
    ...(branchSettings ?? selectedBranch ?? {
      id: selectedBranchId,
      name: selectedBranch?.name || `Branch #${selectedBranchId}`,
      address: selectedBranch?.address || "",
      phone: "",
      is_active: true,
    }),
    ...form,
  });

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  return (
    <DataPanel
      title="Receipt Settings"
      description={`Control the printed header and footer for ${selectedBranch?.name || `Branch #${selectedBranchId}`}.`}
    >
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-brand-primary">Header Title</Label>
              <Input
                value={form.receipt_header_title}
                onChange={(e) => updateField("receipt_header_title", e.target.value)}
                placeholder={branchSettings?.name || "Branch name"}
                disabled={isLoading || saveSettings.isPending}
                className="h-12 rounded-xl border-none bg-slate-50 font-bold text-brand-primary"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-brand-primary">Header Subtitle</Label>
              <Input
                value={form.receipt_header_subtitle}
                onChange={(e) => updateField("receipt_header_subtitle", e.target.value)}
                placeholder="Location or short branch descriptor"
                disabled={isLoading || saveSettings.isPending}
                className="h-12 rounded-xl border-none bg-slate-50 font-bold text-brand-primary"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-brand-primary">Receipt Address</Label>
            <Textarea
              value={form.receipt_address}
              onChange={(e) => updateField("receipt_address", e.target.value)}
              placeholder={branchSettings?.address || "Branch address"}
              disabled={isLoading || saveSettings.isPending}
              className="min-h-[100px] rounded-xl border-none bg-slate-50 font-medium"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-brand-primary">Receipt Phone</Label>
            <Input
              value={form.receipt_phone}
              onChange={(e) => updateField("receipt_phone", e.target.value)}
              placeholder={branchSettings?.phone || "+880..."}
              disabled={isLoading || saveSettings.isPending}
              className="h-12 rounded-xl border-none bg-slate-50 font-bold text-brand-primary"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-brand-primary">Footer Message</Label>
            <Input
              value={form.receipt_footer_message}
              onChange={(e) => updateField("receipt_footer_message", e.target.value)}
              placeholder="Thanks for your purchase"
              disabled={isLoading || saveSettings.isPending}
              className="h-12 rounded-xl border-none bg-slate-50 font-bold text-brand-primary"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-brand-primary">Return Policy</Label>
            <Textarea
              value={form.receipt_return_policy}
              onChange={(e) => updateField("receipt_return_policy", e.target.value)}
              placeholder="Return policy shown at the bottom of the receipt"
              disabled={isLoading || saveSettings.isPending}
              className="min-h-[110px] rounded-xl border-none bg-slate-50 font-medium"
            />
          </div>

          <div className="flex justify-end">
            <Button
              onClick={() => saveSettings.mutate()}
              disabled={isLoading || saveSettings.isPending}
              className="h-12 rounded-xl bg-brand-primary px-6 font-black text-brand-secondary hover:bg-emerald-900"
            >
              {saveSettings.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Receipt Settings
            </Button>
          </div>
        </div>

        <div className="rounded-[28px] border border-brand-primary/10 bg-slate-950 p-4 text-white shadow-xl">
          <div className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300">
            Thermal Preview
          </div>
          <div className="mx-auto w-full max-w-[240px] rounded-[24px] bg-white p-4 text-slate-900 shadow-lg">
            <div className="mb-3 h-1 rounded-full bg-gradient-to-r from-slate-900 to-emerald-500" />
            <div className="text-center">
              <div className="text-sm font-black uppercase tracking-[0.18em]">
                {previewSettings.headerTitle}
              </div>
              {previewSettings.headerSubtitle ? (
                <div className="mt-1 text-[10px] text-slate-500">{previewSettings.headerSubtitle}</div>
              ) : null}
              {previewSettings.address ? (
                <div className="mt-1 whitespace-pre-line text-[10px] text-slate-500">{previewSettings.address}</div>
              ) : null}
              {previewSettings.phone ? (
                <div className="mt-1 text-[10px] text-slate-500">Phone: {previewSettings.phone}</div>
              ) : null}
            </div>
            <div className="my-3 border-t border-dashed border-slate-200" />
            <div className="text-[10px] text-slate-500">Receipt footer preview</div>
            <div className="mt-2 text-center text-[10px] text-slate-600">{previewSettings.footerMessage}</div>
            <div className="mt-2 whitespace-pre-line text-center text-[10px] text-slate-500">{previewSettings.returnPolicy}</div>
          </div>
        </div>
      </div>
    </DataPanel>
  );
}
