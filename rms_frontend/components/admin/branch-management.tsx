"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Building2, Plus } from "lucide-react";

import { branchesApi } from "@/lib/api/branches";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { BranchCard } from "@/components/branch/branch-card";
import { useToast } from "@/components/ui/use-toast";

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
        title: "Branch created",
        description: "The new branch is now available across the app.",
      });
    },
    onError: (e: unknown) => {
      const message =
        (e as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail ?? "Failed to create branch.";
      toast({
        title: "Couldn't create branch",
        description: message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-6">
      <Card className="border-slate-200/80 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-4 w-4 text-indigo-500" />
            Add a new branch
          </CardTitle>
          <CardDescription>
            Branches isolate stock, sales, expenses and staff records. Catalog
            data (categories, products, brands) stays shared.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="branch-name">Branch name</Label>
            <Input
              id="branch-name"
              placeholder="e.g. Sylhet Branch"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="branch-address">Address</Label>
            <Textarea
              id="branch-address"
              placeholder="Branch address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
          <div className="md:col-span-2">
            <Button
              onClick={() => createBranch.mutate()}
              disabled={!name.trim() || createBranch.isPending}
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" />
              {createBranch.isPending ? "Creating..." : "Create branch"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-semibold text-slate-800">
              Existing branches
            </h2>
            <p className="text-xs text-muted-foreground">
              Click a card to drill into staff, sales and KPIs.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-[210px] rounded-2xl" />
            ))}
          </div>
        ) : !branches || branches.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-white p-10 text-center">
            <Building2 className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-2 text-sm font-medium text-foreground">
              No branches yet
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Use the form above to add your first branch.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {branches.map((branch) => (
              <BranchCard
                key={branch.id}
                variant="branch"
                branchId={branch.id}
                name={branch.name}
                address={branch.address}
                active={branch.is_active}
                onSelect={() =>
                  router.push(`/admin/branches/${branch.id}`)
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
