"use client";

import { useLeaveRequests, useApproveLeave } from "@/hooks/queries/use-hr";
import { PageHeader, DataPanel, StatusBadge, TableShell } from "@/components/ui/professional";
import { ClipboardList, Check, X, User } from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { RoleGuard } from "@/components/auth/role-guard";
import { toast } from "sonner";

export default function HRLeavesPage() {
  return (
    <RoleGuard allow={["admin", "hr", "branch_manager"]}>
      <LeaveManagementContent />
    </RoleGuard>
  );
}

function LeaveManagementContent() {
  const { data: leaves, isLoading } = useLeaveRequests();
  const approveMutation = useApproveLeave();

  const handleApprove = async (id: number) => {
    try {
      await approveMutation.mutateAsync(id);
      toast.success("Leave request approved.");
    } catch (err) {
      toast.error("Failed to approve leave.");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <PageHeader
        title="Leave Management"
        description="Review and process personnel time-off requests."
        icon={<ClipboardList className="h-6 w-6" />}
      />

      <DataPanel>
        <div className="overflow-hidden rounded-[24px] border border-brand-primary/5 shadow-sm">
          <TableShell 
            isLoading={isLoading} 
            emptyMessage="No pending leave requests"
            colSpan={6}
          >
            <Table>
              <TableHeader className="bg-brand-primary">
                <TableRow className="hover:bg-brand-primary border-none">
                  <TableHead className="text-brand-secondary font-black text-[10px] uppercase tracking-widest py-4 pl-6">Beneficiary</TableHead>
                  <TableHead className="text-brand-secondary font-black text-[10px] uppercase tracking-widest py-4">Type</TableHead>
                  <TableHead className="text-brand-secondary font-black text-[10px] uppercase tracking-widest py-4">Start Date</TableHead>
                  <TableHead className="text-brand-secondary font-black text-[10px] uppercase tracking-widest py-4">End Date</TableHead>
                  <TableHead className="text-brand-secondary font-black text-[10px] uppercase tracking-widest py-4">Status</TableHead>
                  <TableHead className="text-brand-secondary font-black text-[10px] uppercase tracking-widest py-4 text-right pr-6">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaves?.map((leave) => (
                  <TableRow key={leave.id} className="group hover:bg-slate-50/50 transition-colors border-brand-primary/5">
                    <TableCell className="pl-6">
                       <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-brand-secondary text-brand-primary flex items-center justify-center font-black text-xs">
                          <User className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-black text-brand-primary uppercase tracking-tight">{leave.employee_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{leave.leave_type}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-[11px] font-bold text-slate-600">{leave.start_date}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-[11px] font-bold text-slate-600">{leave.end_date}</span>
                    </TableCell>
                    <TableCell>
                      <StatusBadge 
                        label={leave.status} 
                        tone={
                          leave.status === 'approved' ? "emerald" :
                          leave.status === 'pending' ? "amber" : "rose"
                        } 
                      />
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      {leave.status === 'pending' && (
                        <div className="flex justify-end gap-2">
                           <Button 
                              size="sm" 
                              onClick={() => handleApprove(leave.id)}
                              className="h-8 w-8 p-0 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-none"
                            >
                             <Check className="h-4 w-4" />
                           </Button>
                           <Button 
                              size="sm" 
                              variant="ghost"
                              className="h-8 w-8 p-0 rounded-lg text-rose-500 hover:bg-rose-50"
                            >
                             <X className="h-4 w-4" />
                           </Button>
                        </div>
                      )}
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
