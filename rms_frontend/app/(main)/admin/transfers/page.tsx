"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  ArrowRightLeft,
  Plus,
  Check,
  X,
  PackageCheck,
  Clock,
} from "lucide-react";

import { RoleGuard } from "@/components/auth/role-guard";
import { useBranch } from "@/contexts/branch-context";
import { transfersApi, type StockTransfer } from "@/lib/api/transfers";
import { useToast } from "@/components/ui/use-toast";
import { PageLoading } from "@/components/ui/page-loading";
import { PageError } from "@/components/ui/page-error";
import { PageEmpty } from "@/components/ui/page-empty";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const STATUS_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  PENDING: { label: "Pending", className: "bg-amber-100 text-amber-700" },
  APPROVED: { label: "Approved", className: "bg-blue-100 text-blue-700" },
  COMPLETED: { label: "Completed", className: "bg-emerald-100 text-emerald-700" },
  CANCELLED: { label: "Cancelled", className: "bg-slate-100 text-slate-500" },
};

export default function TransfersPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { availableBranches } = useBranch();
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["transfers", statusFilter],
    queryFn: () =>
      transfersApi.list({
        status: statusFilter === "all" ? undefined : statusFilter,
      }),
  });

  const approveMutation = useMutation({
    mutationFn: transfersApi.approve,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transfers"] });
      toast({ title: "Transfer approved" });
    },
  });

  const completeMutation = useMutation({
    mutationFn: transfersApi.complete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transfers"] });
      toast({ title: "Transfer completed — stock has been moved" });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: transfersApi.cancel,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transfers"] });
      toast({ title: "Transfer cancelled" });
    },
  });

  const transfers = data?.results ?? [];

  return (
    <RoleGuard allow={["admin", "branch_manager"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
              <ArrowRightLeft className="h-6 w-6 text-indigo-500" />
              Stock Transfers
            </h1>
            <p className="text-sm text-muted-foreground">
              Move inventory between branches.
            </p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "Pending",
              value: transfers.filter((t) => t.status === "PENDING").length,
              icon: Clock,
              color: "from-amber-500 to-orange-500",
            },
            {
              label: "Approved",
              value: transfers.filter((t) => t.status === "APPROVED").length,
              icon: Check,
              color: "from-blue-500 to-indigo-500",
            },
            {
              label: "Completed",
              value: transfers.filter((t) => t.status === "COMPLETED").length,
              icon: PackageCheck,
              color: "from-emerald-500 to-teal-500",
            },
            {
              label: "Total",
              value: transfers.length,
              icon: ArrowRightLeft,
              color: "from-slate-600 to-slate-800",
            },
          ].map((stat) => (
            <Card key={stat.label} className="overflow-hidden">
              <div className={`h-1 bg-gradient-to-r ${stat.color}`} />
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                      {stat.label}
                    </p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <div
                    className={`h-10 w-10 rounded-full bg-gradient-to-br ${stat.color} flex items-center justify-center`}
                  >
                    <stat.icon className="h-5 w-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filter */}
        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {isLoading ? (
          <PageLoading count={4} columns="grid-cols-1" height="h-14" />
        ) : isError ? (
          <PageError onRetry={() => refetch()} />
        ) : transfers.length === 0 ? (
          <PageEmpty
            icon={ArrowRightLeft}
            title="No transfers yet"
            description="Create a stock transfer to move inventory between branches."
          />
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>From → To</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Requested By</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transfers.map((t) => {
                    const cfg =
                      STATUS_CONFIG[t.status] || STATUS_CONFIG.PENDING;
                    return (
                      <TableRow key={t.id}>
                        <TableCell className="font-mono text-sm">
                          #{t.id}
                        </TableCell>
                        <TableCell className="text-sm">
                          {t.source_branch_name} → {t.dest_branch_name}
                        </TableCell>
                        <TableCell className="text-sm">
                          {t.items?.length ?? 0} item(s)
                        </TableCell>
                        <TableCell>
                          <Badge className={cfg.className} variant="secondary">
                            {cfg.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {t.requested_by_name || "—"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {format(new Date(t.created_at), "MMM d, HH:mm")}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {t.status === "PENDING" && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={() => approveMutation.mutate(t.id)}
                                  disabled={approveMutation.isPending}
                                >
                                  <Check className="h-3 w-3 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-xs text-rose-600"
                                  onClick={() => cancelMutation.mutate(t.id)}
                                  disabled={cancelMutation.isPending}
                                >
                                  <X className="h-3 w-3 mr-1" />
                                  Cancel
                                </Button>
                              </>
                            )}
                            {t.status === "APPROVED" && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => completeMutation.mutate(t.id)}
                                disabled={completeMutation.isPending}
                              >
                                <PackageCheck className="h-3 w-3 mr-1" />
                                Complete
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </RoleGuard>
  );
}
