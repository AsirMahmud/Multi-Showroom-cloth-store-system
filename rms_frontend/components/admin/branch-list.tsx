"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Building2 } from "lucide-react";

import { branchesApi } from "@/lib/api/branches";
import { BranchCard } from "@/components/branch/branch-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export function BranchList() {
  const router = useRouter();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["branches"],
    queryFn: branchesApi.getBranches,
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-[210px] rounded-2xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center">
        <AlertTriangle className="mx-auto h-8 w-8 text-rose-500" />
        <p className="mt-2 text-sm font-medium text-rose-700">
          Couldn&apos;t load branches.
        </p>
        <Button
          size="sm"
          variant="outline"
          onClick={() => refetch()}
          className="mt-3"
        >
          Try again
        </Button>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-xl border border-dashed bg-white p-10 text-center">
        <Building2 className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="mt-2 text-sm font-medium text-foreground">
          No branches yet
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Add a branch from the management panel to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {data.map((branch) => (
        <BranchCard
          key={branch.id}
          variant="branch"
          branchId={branch.id}
          name={branch.name}
          address={branch.address}
          active={branch.is_active}
          onSelect={() => router.push(`/admin/branches/${branch.id}`)}
        />
      ))}
    </div>
  );
}
