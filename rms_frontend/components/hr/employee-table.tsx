"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useEmployees } from "@/hooks/queries/use-hr";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Briefcase, 
  Download, 
  Building2, 
  ArrowRight,
  Plus
} from "lucide-react";
import { 
  PageHeader, 
  MetricCard, 
  DataPanel, 
  FilterToolbar, 
  StatusBadge, 
  TableShell 
} from "@/components/ui/professional";
import { AddEmployeeDialog } from "@/components/hr/add-employee-dialog";

export function EmployeeTable() {
  const { data, isLoading } = useEmployees();
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  const filteredEmployees = data?.filter((employee) =>
    employee.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeCount = data?.filter(e => e.is_active).length || 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <PageHeader
        title="Workforce Directory"
        description="Unified personnel management across all operational branches."
        icon={<Users className="h-6 w-6" />}
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="h-10 px-4 bg-white border-brand-primary/5 shadow-sm rounded-xl font-bold text-xs uppercase tracking-widest text-brand-primary"
              disabled={isLoading}
            >
              <Download className="w-3.5 h-3.5 mr-2" />
              Export roster
            </Button>
            <AddEmployeeDialog />
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          label="Total Staff"
          value={data?.length || 0}
          icon={<Users className="h-5 w-5" />}
          tone="brand"
        />
        <MetricCard
          label="Active Duty"
          value={activeCount}
          icon={<Building2 className="h-5 w-5" />}
          tone="emerald"
        />
        <MetricCard
          label="New Hires"
          value={data?.filter(e => {
            if (!e.hire_date) return false;
            const hire = new Date(e.hire_date);
            const now = new Date();
            return hire.getMonth() === now.getMonth() && hire.getFullYear() === now.getFullYear();
          }).length || 0}
          icon={<Plus className="h-5 w-5" />}
          tone="indigo"
          helper="Joined this month"
        />
      </div>

      <DataPanel>
        <FilterToolbar
          search={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Filter by name, role, email..."
        />

        <div className="mt-6 overflow-hidden rounded-[24px] border border-brand-primary/5 shadow-sm">
          <TableShell 
            isLoading={isLoading} 
            emptyMessage={searchTerm ? "No personnel matching your criteria" : "No employees registered"}
            colSpan={5}
          >
            <Table>
              <TableHeader className="bg-brand-primary">
                <TableRow className="hover:bg-brand-primary border-none">
                  <TableHead className="text-brand-secondary font-black text-[10px] uppercase tracking-widest py-4 pl-6">Personnel</TableHead>
                  <TableHead className="text-brand-secondary font-black text-[10px] uppercase tracking-widest py-4">Specialization</TableHead>
                  <TableHead className="text-brand-secondary font-black text-[10px] uppercase tracking-widest py-4">Deployment</TableHead>
                  <TableHead className="text-brand-secondary font-black text-[10px] uppercase tracking-widest py-4">Status</TableHead>
                  <TableHead className="text-brand-secondary font-black text-[10px] uppercase tracking-widest py-4 text-right pr-6">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees?.map((employee) => (
                  <TableRow 
                    key={employee.id} 
                    className="group hover:bg-slate-50/50 transition-colors border-brand-primary/5 cursor-pointer"
                    onClick={() => router.push(`/hr/employees/${employee.id}`)}
                  >
                    <TableCell className="pl-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-brand-secondary text-brand-primary flex items-center justify-center font-black text-sm shadow-sm group-hover:scale-105 transition-transform">
                          {employee.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-black text-brand-primary uppercase tracking-tight">{employee.full_name}</p>
                          <p className="text-[10px] font-bold text-slate-400">{employee.email || employee.phone}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-slate-600">
                        <Briefcase className="h-3.5 w-3.5 opacity-40" />
                        <span className="text-[11px] font-bold uppercase tracking-wider">{employee.designation || "-"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-slate-600">
                        <Building2 className="h-3.5 w-3.5 opacity-40" />
                        <span className="text-[11px] font-bold uppercase tracking-wider">{employee.branch_name || "Headquarters"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge 
                        label={employee.is_active ? "Active" : "Inactive"} 
                        tone={employee.is_active ? "emerald" : "slate"} 
                      />
                    </TableCell>
                    <TableCell className="text-right pr-6">
                       <Button variant="ghost" size="sm" className="h-8 w-8 rounded-lg p-0 text-slate-300 group-hover:text-brand-primary group-hover:bg-brand-secondary transition-all">
                         <ArrowRight className="h-4 w-4" />
                       </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableShell>
        </div>
      </DataPanel>
    </div>
  );
}
