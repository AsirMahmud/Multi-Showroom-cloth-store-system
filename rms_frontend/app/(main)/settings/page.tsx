"use client";

import { useState } from "react";
import { PageHeader, DataPanel } from "@/components/ui/professional";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
import { Loader2, Trash2, Settings, ShieldAlert, Palette, Database } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

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
        title="System Infrastructure"
        description="Core configuration, security protocols, and database lifecycle management."
        icon={<Settings className="h-6 w-6" />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div variants={item} className="space-y-8">
          <DataPanel 
            title="Aesthetics & Interface" 
            description="Global UI preferences and branding toggle."
          >
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-brand-primary/5 transition-all hover:bg-white hover:shadow-lg">
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase tracking-widest text-brand-primary">Bismillah Protocol</Label>
                <p className="text-[11px] font-medium text-slate-400">
                  Toggle symbolic identifier in navigation stream.
                </p>
              </div>
              <Switch checked={showBismillah} onCheckedChange={toggleBismillah} />
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
