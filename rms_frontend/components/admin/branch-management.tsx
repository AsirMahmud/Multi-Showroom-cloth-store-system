"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Building2, Plus, MapPin, Store } from "lucide-react";

import { branchesApi } from "@/lib/api/branches";
import { DataPanel } from "@/components/ui/professional";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { BranchCard } from "@/components/branch/branch-card";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

export function BranchManagement() {
  const qc = useQueryClient();
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");

  const { data: branches, isLoading } = useQuery({
    queryKey: ["branches"],
    queryFn: branchesApi.getBranches,
  });

  const createBranch = useMutation({
    mutationFn: () =>
      branchesApi.createBranch({
        name: name.trim(),
        address: address.trim(),
      }),
    onSuccess: () => {
      setName("");
      setAddress("");
      qc.invalidateQueries({ queryKey: ["branches"] });
      toast({
        title: "Node Initialized",
        description: "The organizational branch has been successfully mapped to the grid.",
      });
    },
    onError: (e: unknown) => {
      const message =
        (e as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail ?? "Failed to initialize node.";
      toast({
        title: "Initialization Fault",
        description: message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-8">
      <DataPanel
        title="Node Initialization"
        description="Expand the organizational grid by provisioning a new branch node."
      >
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Node Identifier (Name)</Label>
            <div className="relative">
              <Store className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="e.g. Dhaka Central Hub"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pl-10 h-11 bg-slate-50 border-none rounded-xl font-bold text-sm"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Geographic Coordinates (Address)</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Textarea
                placeholder="Detailed physical address..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="pl-10 min-h-[44px] bg-slate-50 border-none rounded-xl font-bold text-sm py-3"
              />
            </div>
          </div>
          <div className="md:col-span-2">
            <Button
              onClick={() => createBranch.mutate()}
              disabled={!name.trim() || createBranch.isPending}
              className="h-12 px-8 rounded-xl font-bold bg-brand-primary text-brand-secondary hover:bg-emerald-900 shadow-lg shadow-brand-primary/20 transition-all active:scale-95"
            >
              {createBranch.isPending ? "Provisioning Node..." : "Initialize Branch"}
              <Plus className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </DataPanel>

      <DataPanel
        title="Active Grid Nodes"
        description="Drill into specific branch infrastructure for staff and inventory auditing."
      >
        <div className="space-y-6">
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-[210px] rounded-[32px]" />
              ))}
            </div>
          ) : !branches || branches.length === 0 ? (
            <div className="rounded-[40px] border-2 border-dashed border-brand-primary/5 bg-slate-50/50 p-20 text-center flex flex-col items-center">
              <div className="h-16 w-16 rounded-3xl bg-white shadow-premium flex items-center justify-center mb-6">
                <Building2 className="h-8 w-8 text-slate-200" />
              </div>
              <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Null Node Set</p>
              <p className="text-xs text-slate-300 mt-2">Initialize your first organizational node using the form above.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {branches.map((branch) => (
                <div key={branch.id} className="transition-transform duration-300 hover:scale-[1.02] active:scale-98">
                  <BranchCard
                    variant="branch"
                    branchId={branch.id}
                    name={branch.name}
                    address={branch.address}
                    active={branch.is_active}
                    onSelect={() =>
                      router.push(`/admin/branches/${branch.id}`)
                    }
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </DataPanel>
    </div>
  );
}
