"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  Shield,
  Filter,
  ChevronDown,
  Plus,
  Pencil,
  Trash2,
  Eye,
} from "lucide-react";

import { RoleGuard } from "@/components/auth/role-guard";
import { useAuditLog } from "@/hooks/queries/use-audit-log";
import { useBranch } from "@/contexts/branch-context";
import { PageLoading } from "@/components/ui/page-loading";
import { PageError } from "@/components/ui/page-error";
import { PageEmpty } from "@/components/ui/page-empty";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import type { AuditLogEntry, AuditLogFilters } from "@/lib/api/audit-log";

const ACTION_CONFIG = {
  CREATE: { label: "Created", icon: Plus, className: "bg-emerald-100 text-emerald-700" },
  UPDATE: { label: "Updated", icon: Pencil, className: "bg-amber-100 text-amber-700" },
  DELETE: { label: "Deleted", icon: Trash2, className: "bg-rose-100 text-rose-700" },
} as const;

export default function AuditLogPage() {
  const { availableBranches } = useBranch();
  const [filters, setFilters] = useState<AuditLogFilters>({});
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<AuditLogEntry | null>(null);

  const { data, isLoading, isError, refetch } = useAuditLog({
    ...filters,
    page,
  });

  const entries = data?.results ?? [];
  const totalPages = data ? Math.ceil(data.count / 10) : 1;

  return (
    <RoleGuard allow={["admin"]}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Shield className="h-6 w-6 text-indigo-500" />
            Audit Log
          </h1>
          <p className="text-sm text-muted-foreground">
            Track all changes made across the system.
          </p>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <Select
                value={filters.action || "all"}
                onValueChange={(v) =>
                  setFilters((f) => ({ ...f, action: v === "all" ? undefined : v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="CREATE">Create</SelectItem>
                  <SelectItem value="UPDATE">Update</SelectItem>
                  <SelectItem value="DELETE">Delete</SelectItem>
                </SelectContent>
              </Select>

              <Input
                placeholder="Entity type (e.g. Product)"
                value={filters.entity_type || ""}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    entity_type: e.target.value || undefined,
                  }))
                }
              />

              <Select
                value={filters.branch?.toString() || "all"}
                onValueChange={(v) =>
                  setFilters((f) => ({
                    ...f,
                    branch: v === "all" ? undefined : parseInt(v),
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Branch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branches</SelectItem>
                  {availableBranches.map((b) => (
                    <SelectItem key={b.id} value={b.id.toString()}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                type="date"
                value={filters.created_at__gte || ""}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    created_at__gte: e.target.value || undefined,
                  }))
                }
                placeholder="From date"
              />
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        {isLoading ? (
          <PageLoading count={6} columns="grid-cols-1" height="h-12" />
        ) : isError ? (
          <PageError onRetry={() => refetch()} />
        ) : entries.length === 0 ? (
          <PageEmpty
            icon={Shield}
            title="No audit logs yet"
            description="Activity will appear here as users make changes."
          />
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[140px]">Time</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead className="w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => {
                    const cfg = ACTION_CONFIG[entry.action] || ACTION_CONFIG.UPDATE;
                    const Icon = cfg.icon;
                    return (
                      <TableRow key={entry.id}>
                        <TableCell className="text-xs text-muted-foreground">
                          {format(new Date(entry.created_at), "MMM d, HH:mm")}
                        </TableCell>
                        <TableCell className="text-sm">
                          {entry.actor_username || "System"}
                        </TableCell>
                        <TableCell>
                          <Badge className={cfg.className} variant="secondary">
                            <Icon className="h-3 w-3 mr-1" />
                            {cfg.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          <span className="font-medium">{entry.entity_type}</span>
                          <span className="text-muted-foreground ml-1">
                            #{entry.entity_id}
                          </span>
                          {entry.entity_repr && (
                            <span className="block text-xs text-muted-foreground truncate max-w-[200px]">
                              {entry.entity_repr}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {entry.branch_name || "—"}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setDetail(entry)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <span className="text-sm self-center text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        )}

        {/* Detail Dialog */}
        <Dialog open={!!detail} onOpenChange={() => setDetail(null)}>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {detail?.action} — {detail?.entity_type} #{detail?.entity_id}
              </DialogTitle>
            </DialogHeader>
            {detail && (
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">User:</span>{" "}
                    {detail.actor_username || "System"}
                  </div>
                  <div>
                    <span className="text-muted-foreground">IP:</span>{" "}
                    {detail.ip_address || "—"}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Branch:</span>{" "}
                    {detail.branch_name || "—"}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Time:</span>{" "}
                    {format(new Date(detail.created_at), "PPpp")}
                  </div>
                </div>
                {detail.before_json && (
                  <div>
                    <p className="font-medium text-xs text-muted-foreground mb-1">
                      Before
                    </p>
                    <pre className="bg-slate-50 rounded-md p-3 text-xs overflow-x-auto max-h-40">
                      {JSON.stringify(detail.before_json, null, 2)}
                    </pre>
                  </div>
                )}
                {detail.after_json && (
                  <div>
                    <p className="font-medium text-xs text-muted-foreground mb-1">
                      After
                    </p>
                    <pre className="bg-slate-50 rounded-md p-3 text-xs overflow-x-auto max-h-40">
                      {JSON.stringify(detail.after_json, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </RoleGuard>
  );
}
