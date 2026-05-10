"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSuppliers, useDeleteSupplier } from "@/hooks/queries/useInventory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  PlusCircle,
  Search,
  Building2,
  Phone,
  Mail,
  Globe,
  MoreHorizontal,
  Edit3,
  Eye,
  Trash2,
  Package,
  Users,
  DollarSign,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import type { Supplier } from "@/types/inventory";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { PageHeader, MetricCard, DataPanel, TableSkeleton } from "@/components/ui/professional";
import { cn } from "@/lib/utils";

export default function SuppliersPage() {
  const router = useRouter();
  const { data: suppliers = [], isLoading } = useSuppliers();
  const deleteSupplier = useDeleteSupplier();
  const [searchQuery, setSearchQuery] = useState("");
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(
    null
  );

  const handleDeleteSupplier = async () => {
    if (!supplierToDelete) return;

    try {
      await deleteSupplier.mutateAsync(supplierToDelete.id);
      toast.success("Supplier deleted successfully");
    } catch (error) {
      toast.error("Failed to delete supplier");
      console.error("Error deleting supplier:", error);
    } finally {
      setSupplierToDelete(null);
    }
  };

  // Filter suppliers based on search
  const filteredSuppliers = suppliers.filter((supplier: Supplier) =>
    supplier.company_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate statistics
  const totalSuppliers = suppliers.length;
  const activeSuppliers = suppliers.filter((s: Supplier) => s.is_active).length;
  const totalProducts = suppliers.reduce(
    (sum: number, supplier: Supplier) => sum + (supplier.products_count || 0),
    0
  );
  const totalValue = suppliers.reduce(
    (sum: number, supplier: Supplier) => sum + (supplier.total_value || 0),
    0
  );

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-64 bg-slate-100 animate-pulse rounded-xl" />
            <div className="h-4 w-96 bg-slate-50 animate-pulse rounded-lg" />
          </div>
          <div className="h-10 w-32 bg-slate-100 animate-pulse rounded-xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-[24px] bg-slate-100 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-56 rounded-[32px] bg-slate-100 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const SupplierCard = ({ supplier }: { supplier: Supplier }) => (
    <div className="group relative bg-white rounded-[32px] p-6 border border-slate-100 hover:shadow-2xl hover:shadow-brand-primary/5 transition-all duration-500 hover:-translate-y-1">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:bg-brand-primary/5 transition-colors">
            <Building2 className="h-6 w-6 text-brand-primary" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 leading-tight mb-1 group-hover:text-brand-primary transition-colors line-clamp-1">
              {supplier.company_name}
            </h3>
            <Badge variant={supplier.is_active ? "default" : "secondary"} className={cn(
              "border-none font-black text-[9px] uppercase tracking-widest",
              supplier.is_active ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"
            )}>
              {supplier.is_active ? "Active" : "Inactive"}
            </Badge>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 rounded-2xl border-slate-100 shadow-xl p-2">
            <DropdownMenuItem asChild className="rounded-xl py-2.5 cursor-pointer">
              <Link href={`/inventory/suppliers/${supplier.id}`}>
                <Eye className="mr-2 h-4 w-4" /> View Details
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="rounded-xl py-2.5 cursor-pointer">
              <Link href={`/inventory/suppliers/edit/${supplier.id}`}>
                <Edit3 className="mr-2 h-4 w-4" /> Edit Supplier
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-2 bg-slate-50" />
            <DropdownMenuItem className="rounded-xl py-2.5 text-rose-600 cursor-pointer" onClick={() => setSupplierToDelete(supplier)}>
              <Trash2 className="mr-2 h-4 w-4" /> Delete Supplier
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-3 mb-6">
        <div className="flex items-center gap-3 bg-slate-50/50 p-3 rounded-xl border border-slate-50">
          <Phone className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-xs font-bold text-slate-600">{supplier.phone || "N/A"}</span>
        </div>
        <div className="flex items-center gap-3 bg-slate-50/50 p-3 rounded-xl border border-slate-50">
          <Mail className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-xs font-bold text-slate-600 line-clamp-1">{supplier.email || "N/A"}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-6 border-t border-slate-50">
        <div>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">SKU Count</p>
          <p className="text-sm font-black text-brand-primary">{supplier.products_count || 0}</p>
        </div>
        <div>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Net Value</p>
          <p className="text-sm font-black text-emerald-600">${supplier.total_value?.toLocaleString() || 0}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Supply Chain Matrix"
        description="Global vendor management and procurement logistics control."
        icon={<Building2 className="h-6 w-6" />}
        actions={
          <Button
            onClick={() => router.push("/inventory/suppliers/add")}
            className="h-10 px-4 bg-brand-primary text-brand-secondary hover:bg-emerald-900 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-brand-primary/20"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Register Vendor
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Vendor Network"
          value={totalSuppliers}
          icon={<Building2 className="h-5 w-5" />}
          tone="brand"
          helper={`${activeSuppliers} Active Partners`}
        />
        <MetricCard
          label="Node Distribution"
          value={totalProducts}
          icon={<Package className="h-5 w-5" />}
          tone="brand"
          helper="Aggregate SKU count"
        />
        <MetricCard
          label="Liquidity Value"
          value={`$${totalValue.toLocaleString()}`}
          icon={<DollarSign className="h-5 w-5" />}
          tone="emerald"
          helper="Procurement valuation"
        />
      </div>

      <DataPanel title="Vendor Directory" description="Manage your global supplier network and transactional relationships.">
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search vendors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-11 bg-slate-50/50 border-none rounded-xl focus-visible:ring-brand-primary"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSuppliers.map((supplier) => (
            <SupplierCard key={supplier.id} supplier={supplier} />
          ))}
        </div>
      </DataPanel>

      <AlertDialog open={!!supplierToDelete} onOpenChange={() => setSupplierToDelete(null)}>
        <AlertDialogContent className="rounded-[32px] border-none shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black text-slate-900">Decommission Vendor?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 font-medium">
              This will permanently remove the supplier node from the global network. This action cannot be reverted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl font-bold uppercase text-[10px] tracking-widest border-slate-100">Abort</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSupplier} className="bg-rose-600 hover:bg-rose-700 rounded-xl font-bold uppercase text-[10px] tracking-widest">Confirm Deletion</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
