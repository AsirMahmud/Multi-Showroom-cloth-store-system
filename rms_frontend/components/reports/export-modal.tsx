"use client";

import { useState } from "react";
import {
  Download,
  FileSpreadsheet,
  FileText,
  ShoppingBag,
  Users,
  DollarSign,
  Package,
  Calendar,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useBranch } from "@/contexts/branch-context";
import { useToast } from "@/components/ui/use-toast";
import axiosInstance from "@/lib/api/axios-config";

const DATA_TYPES = [
  { value: "sales", label: "Sales", icon: ShoppingBag },
  { value: "expenses", label: "Expenses", icon: DollarSign },
  { value: "inventory", label: "Inventory", icon: Package },
  { value: "customers", label: "Customers", icon: Users },
  { value: "attendance", label: "Attendance", icon: Calendar },
] as const;

const FORMATS = [
  { value: "csv", label: "CSV", icon: FileText },
  { value: "xlsx", label: "Excel (XLSX)", icon: FileSpreadsheet },
] as const;

interface ExportModalProps {
  trigger?: React.ReactNode;
}

export function ExportModal({ trigger }: ExportModalProps) {
  const [open, setOpen] = useState(false);
  const [dataType, setDataType] = useState<string>("sales");
  const [format, setFormat] = useState<string>("csv");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [branchId, setBranchId] = useState<string>("current");
  const [isExporting, setIsExporting] = useState(false);

  const { availableBranches, selectedBranchId } = useBranch();
  const { toast } = useToast();

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const params: Record<string, string> = {
        data_type: dataType,
        format,
      };
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      if (branchId !== "all") {
        params.branch = branchId === "current"
          ? String(selectedBranchId || "")
          : branchId;
      }

      const res = await axiosInstance.get("/api/reports/export/", {
        params,
        responseType: "blob",
      });

      // Trigger download
      const blob = new Blob([res.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${dataType}_export_${new Date().toISOString().slice(0, 10)}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export complete",
        description: `${dataType} data has been downloaded.`,
      });
      setOpen(false);
    } catch {
      toast({
        title: "Export failed",
        description: "Could not generate the export. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export Data
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-indigo-500" />
            Export Data
          </DialogTitle>
          <DialogDescription>
            Download branch data as CSV or Excel.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Data Type</Label>
            <Select value={dataType} onValueChange={setDataType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DATA_TYPES.map((dt) => (
                  <SelectItem key={dt.value} value={dt.value}>
                    <div className="flex items-center gap-2">
                      <dt.icon className="h-4 w-4" />
                      {dt.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Format</Label>
            <Select value={format} onValueChange={setFormat}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FORMATS.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    <div className="flex items-center gap-2">
                      <f.icon className="h-4 w-4" />
                      {f.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Branch</Label>
            <Select value={branchId} onValueChange={setBranchId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">Current Branch</SelectItem>
                <SelectItem value="all">All Branches</SelectItem>
                {availableBranches.map((b) => (
                  <SelectItem key={b.id} value={b.id.toString()}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>From</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>To</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="w-full gap-2"
          >
            <Download className="h-4 w-4" />
            {isExporting ? "Exporting..." : "Download Export"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
