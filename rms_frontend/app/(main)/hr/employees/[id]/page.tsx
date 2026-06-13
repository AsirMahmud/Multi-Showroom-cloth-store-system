"use client";
import { useParams } from "next/navigation";
import { useEmployeeHRProfile, useRunIndividualPayroll, useSettlePayroll } from "@/hooks/queries/use-hr";
import { PageHeader, DataPanel, MetricCard, StatusBadge, TableSkeleton } from "@/components/ui/professional";
import { 
  User, 
  Briefcase, 
  Building2, 
  Calendar, 
  Wallet, 
  History, 
  FileText, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Plus,
  Play
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { toast } from "sonner";

export default function EmployeeDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: employee, isLoading } = useEmployeeHRProfile(id);
  const runPayroll = useRunIndividualPayroll();
  const settlePayroll = useSettlePayroll();

  const handleRunPayroll = async () => {
    try {
      await runPayroll.mutateAsync({ id });
      toast.success("Payroll processed successfully for this employee.");
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to process payroll.");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8 p-8">
        <TableSkeleton rows={10} />
      </div>
    );
  }

  if (!employee) return <div>Employee not found</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        title={employee.full_name}
        description={`${employee.designation} at ${employee.branch_name || 'Branch'}`}
        icon={<User className="h-6 w-6" />}
        actions={
          <div className="flex gap-3">
             <Button 
                onClick={handleRunPayroll}
                disabled={runPayroll.isPending}
                className="bg-brand-primary text-brand-secondary hover:bg-emerald-900 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg"
             >
               {runPayroll.isPending ? "Processing..." : "Process Monthly Salary"}
               <Play className="ml-2 h-3.5 w-3.5 fill-current" />
             </Button>
          </div>
        }
        meta={
          <StatusBadge 
            label={employee.is_active ? "Active Duty" : "Inactive"} 
            tone={employee.is_active ? "emerald" : "slate"} 
          />
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          label="Base Salary"
          value={`$${parseFloat(employee.base_salary).toLocaleString()}`}
          icon={<Wallet className="h-5 w-5" />}
          tone="brand"
        />
        <MetricCard
          label="Total Earnings"
          value={`$${(parseFloat(employee.base_salary) + (employee.salary_structures?.filter(s => s.component_type === 'earning').reduce((acc, s) => acc + parseFloat(s.amount), 0) || 0)).toLocaleString()}`}
          icon={<Plus className="h-5 w-5 text-emerald-500" />}
          tone="emerald"
        />
        <MetricCard
          label="Monthly Deductions"
          value={`$${(employee.salary_structures?.filter(s => s.component_type === 'deduction').reduce((acc, s) => acc + parseFloat(s.amount), 0) || 0).toLocaleString()}`}
          icon={<XCircle className="h-5 w-5 text-rose-500" />}
          tone="rose"
        />
        <MetricCard
          label="Hire Date"
          value={employee.hire_date || "N/A"}
          icon={<Calendar className="h-5 w-5" />}
          tone="slate"
        />
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-white/50 backdrop-blur-md p-1 rounded-2xl border border-brand-primary/5">
          <TabsTrigger value="profile" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-brand-primary data-[state=active]:text-brand-secondary">Profile</TabsTrigger>
          <TabsTrigger value="salary" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-brand-primary data-[state=active]:text-brand-secondary">Salary Structure</TabsTrigger>
          <TabsTrigger value="payroll" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-brand-primary data-[state=active]:text-brand-secondary">Payroll History</TabsTrigger>
          <TabsTrigger value="leave" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-brand-primary data-[state=active]:text-brand-secondary">Leaves</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <DataPanel title="Personal Information" className="lg:col-span-2">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <InfoItem label="Email Address" value={employee.email} icon={<FileText className="h-4 w-4" />} />
                  <InfoItem label="Phone Number" value={employee.phone} icon={<Clock className="h-4 w-4" />} />
                  <InfoItem label="Designation" value={employee.designation} icon={<Briefcase className="h-4 w-4" />} />
                  <InfoItem label="Assigned Branch" value={employee.branch_name} icon={<Building2 className="h-4 w-4" />} />
               </div>
            </DataPanel>
            
            <DataPanel title="Quick Stats">
               <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Attendance Rate</span>
                    <span className="text-sm font-black text-brand-primary">98%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 w-[98%]" />
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium">Consistent performer with minimal leaves this quarter.</p>
               </div>
            </DataPanel>
          </div>
        </TabsContent>

        <TabsContent value="salary">
           <DataPanel 
            title="Compensation Structure" 
            description="Recurring earnings and deductions for this employee."
            actions={
              <Button size="sm" variant="outline" className="rounded-xl font-bold text-[10px] uppercase tracking-widest border-brand-primary/10">
                <Plus className="h-3 w-3 mr-1.5" /> Adjust Components
              </Button>
            }
           >
              <div className="overflow-hidden rounded-2xl border border-brand-primary/5">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest">Component Name</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest">Type</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-bold">Base Salary</TableCell>
                      <TableCell><Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none">Earning</Badge></TableCell>
                      <TableCell className="text-right font-black">${parseFloat(employee.base_salary).toLocaleString()}</TableCell>
                    </TableRow>
                    {employee.salary_structures?.map((struct) => (
                      <TableRow key={struct.id}>
                        <TableCell className="font-bold">{struct.component_name}</TableCell>
                        <TableCell>
                          <Badge className={struct.component_type === 'earning' ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none" : "bg-rose-100 text-rose-700 hover:bg-rose-100 border-none"}>
                            {struct.component_type.charAt(0).toUpperCase() + struct.component_type.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-black">${parseFloat(struct.amount).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
           </DataPanel>
        </TabsContent>

        <TabsContent value="payroll">
           <DataPanel 
            title="Payment History" 
            description="Historical compensation records and settlement status."
           >
              <div className="overflow-hidden rounded-2xl border border-brand-primary/5">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest">Period</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest">Gross</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest">Deductions</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest">Net Payable</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employee.payroll_records?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12 text-slate-400 font-bold uppercase text-[10px] tracking-widest">No history found</TableCell>
                      </TableRow>
                    ) : (
                      employee.payroll_records?.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell className="font-bold">{record.period_start}</TableCell>
                          <TableCell>${parseFloat(record.gross_amount).toLocaleString()}</TableCell>
                          <TableCell className="text-rose-500">-${parseFloat(record.deductions).toLocaleString()}</TableCell>
                          <TableCell className="font-black">${parseFloat(record.net_amount).toLocaleString()}</TableCell>
                          <TableCell>
                            {record.is_paid ? (
                              <div className="flex items-center gap-1.5 text-emerald-600">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Settled</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1.5 text-rose-500 mr-4">
                                  <XCircle className="h-3.5 w-3.5" />
                                  <span className="text-[10px] font-black uppercase tracking-widest">Pending</span>
                                </div>
                                <Button 
                                  size="sm" 
                                  onClick={() => settlePayroll.mutate(record.id)}
                                  disabled={settlePayroll.isPending}
                                  className="h-7 px-3 rounded-lg bg-brand-primary text-brand-secondary hover:bg-emerald-900 font-bold text-[9px] uppercase tracking-widest shadow-sm"
                                >
                                  {settlePayroll.isPending ? "Settling..." : "Settle"}
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
           </DataPanel>
        </TabsContent>

        <TabsContent value="leave">
           <DataPanel 
            title="Leave Management" 
            description="Track vacation, sick leaves, and casual time-off."
            actions={
              <Button size="sm" variant="outline" className="rounded-xl font-bold text-[10px] uppercase tracking-widest border-brand-primary/10">
                <Plus className="h-3 w-3 mr-1.5" /> Request Leave
              </Button>
            }
           >
              <div className="overflow-hidden rounded-2xl border border-brand-primary/5">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest">Type</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest">Start</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest">End</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employee.leave_requests?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-12 text-slate-400 font-bold uppercase text-[10px] tracking-widest">No leaves recorded</TableCell>
                      </TableRow>
                    ) : (
                      employee.leave_requests?.map((leave) => (
                        <TableRow key={leave.id}>
                          <TableCell className="font-bold uppercase text-[10px] tracking-wider">{leave.leave_type}</TableCell>
                          <TableCell>{leave.start_date}</TableCell>
                          <TableCell>{leave.end_date}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={
                              leave.status === 'approved' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                              leave.status === 'pending' ? "bg-amber-50 text-amber-700 border-amber-100" :
                              "bg-rose-50 text-rose-700 border-rose-100"
                            }>
                              {leave.status.toUpperCase()}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
           </DataPanel>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function InfoItem({ label, value, icon }: { label: string; value: string; icon: any }) {
  return (
    <div className="space-y-1.5">
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
        {icon} {label}
      </span>
      <p className="text-sm font-bold text-brand-primary">{value || 'N/A'}</p>
    </div>
  );
}
