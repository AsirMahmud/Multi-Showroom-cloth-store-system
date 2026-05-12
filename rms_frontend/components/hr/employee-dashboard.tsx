"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { 
  User, 
  Mail, 
  Phone, 
  Briefcase, 
  CalendarDays, 
  DollarSign, 
  Building2,
  FileText,
  Clock,
  Activity,
  CheckCircle2,
  Banknote,
  AlertCircle
} from "lucide-react";

import { hrApi } from "@/lib/api/hr";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAttendance, usePayroll } from "@/hooks/queries/use-hr";
import { MetricCard, DataPanel, PageHeader } from "@/components/ui/professional";
import { formatCurrency, cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

export function EmployeeDashboard({ employeeId }: { employeeId: string }) {
  const { data: employee, isLoading: isEmployeeLoading } = useQuery({
    queryKey: ["employee", employeeId],
    queryFn: () => hrApi.getEmployeeById(employeeId),
  });

  const { data: attendanceData, isLoading: isAttendanceLoading } = useAttendance();

  const employeeAttendance = attendanceData?.filter(
    (a) => a.employee.toString() === employeeId
  ) || [];

  if (isEmployeeLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-40 rounded-[32px]" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-64 rounded-[32px]" />
          <Skeleton className="h-64 rounded-[32px]" />
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <DataPanel title="Error" description="There was an error loading the employee record.">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-rose-500 mx-auto mb-4" />
          <p className="text-slate-600 font-bold">Employee record not found.</p>
        </div>
      </DataPanel>
    );
  }

  return (
    <div className="space-y-8">
      <motion.div variants={item} className="bg-white/50 backdrop-blur-md border border-slate-100 p-8 rounded-[32px] shadow-sm flex flex-col md:flex-row gap-8 items-center">
        <Avatar className="h-24 w-24 border-4 border-white shadow-xl ring-1 ring-slate-100">
          <AvatarFallback className="bg-brand-secondary text-brand-primary text-3xl font-black">
            {employee.full_name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 text-center md:text-left space-y-2">
          <h1 className="text-3xl font-black text-brand-primary tracking-tight">{employee.full_name}</h1>
          <div className="flex items-center justify-center md:justify-start gap-2">
            <Badge className="bg-brand-secondary text-brand-primary border-none font-black text-[10px] uppercase tracking-widest px-3 py-1">
              {employee.designation || "Staff Member"}
            </Badge>
            <Badge variant={employee.is_active ? "default" : "secondary"} className={cn(
              "border-none font-black text-[10px] uppercase tracking-widest px-3 py-1",
              employee.is_active ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-400"
            )}>
              {employee.is_active ? "Active" : "Inactive"}
            </Badge>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
          <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Branch</div>
            <div className="text-xs font-black text-slate-700">{employee.branch_name || employee.branch}</div>
          </div>
          <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Base Salary</div>
            <div className="text-xs font-black text-emerald-600">{formatCurrency(parseFloat(employee.base_salary))}</div>
          </div>
        </div>
      </motion.div>

      <Tabs defaultValue="overview" className="space-y-8">
        <TabsList className="bg-slate-50 border-none p-1 h-12 shadow-inner rounded-2xl flex justify-start gap-1 w-fit">
          <TabsTrigger value="overview" className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-brand-primary data-[state=active]:shadow-sm px-6 font-black text-[10px] uppercase tracking-widest transition-all">
            Profile
          </TabsTrigger>
          <TabsTrigger value="attendance" className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-brand-primary data-[state=active]:shadow-sm px-6 font-black text-[10px] uppercase tracking-widest transition-all">
            Attendance
          </TabsTrigger>
          <TabsTrigger value="payroll" className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-brand-primary data-[state=active]:shadow-sm px-6 font-black text-[10px] uppercase tracking-widest transition-all">
            Payroll
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="m-0 space-y-8 focus-visible:outline-none">
          <DataPanel title="Personal Information" description="Contact details and identification information.">
            <div className="grid md:grid-cols-2 gap-8 pt-4">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Email Address</div>
                    <div className="text-xs font-black text-slate-700">{employee.email || "Not set"}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Phone Number</div>
                    <div className="text-xs font-black text-slate-700">{employee.phone || "Not set"}</div>
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                    <Briefcase className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Designation</div>
                    <div className="text-xs font-black text-slate-700">{employee.designation || "Staff"}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                    <CalendarDays className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Date of Joining</div>
                    <div className="text-xs font-black text-slate-700">
                      {employee.hire_date ? format(new Date(employee.hire_date), "MMMM d, yyyy") : "Date not set"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </DataPanel>
        </TabsContent>

        <TabsContent value="attendance" className="m-0 space-y-8 focus-visible:outline-none">
          <DataPanel title="Recent Attendance" description="A record of the staff member's daily attendance.">
            {isAttendanceLoading ? (
              <div className="text-center py-8 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Loading...</div>
            ) : employeeAttendance.length === 0 ? (
              <div className="text-center py-12 text-slate-300">
                <Clock className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p className="font-black text-[10px] uppercase tracking-widest">No attendance records found.</p>
              </div>
            ) : (
              <div className="space-y-3 pt-4">
                {employeeAttendance.slice(0, 15).map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-4 bg-white/50 backdrop-blur-sm border border-slate-100 rounded-2xl hover:border-brand-primary/10 transition-all">
                    <div className="flex items-center gap-3">
                      <CalendarDays className="h-4 w-4 text-slate-400" />
                      <span className="text-xs font-black text-slate-700">{format(new Date(record.date), "MMMM d, yyyy")}</span>
                    </div>
                    <Badge 
                      className={cn(
                        "border-none font-black text-[9px] uppercase tracking-widest",
                        record.status === 'present' ? 'bg-emerald-50 text-emerald-600' :
                        record.status === 'absent' ? 'bg-rose-50 text-rose-600' :
                        record.status === 'late' ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'
                      )}
                    >
                      {record.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </DataPanel>
        </TabsContent>

        <TabsContent value="payroll" className="m-0 space-y-8 focus-visible:outline-none">
          <EmployeePayrollTab employeeId={employeeId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmployeePayrollTab({ employeeId }: { employeeId: string }) {
  const { data: payrollData, isLoading } = usePayroll();
  const qc = useQueryClient();
  const { toast } = useToast();

  const employeePayroll = payrollData?.filter(
    (p) => p.employee.toString() === employeeId
  ).sort((a, b) => new Date(b.period_start).getTime() - new Date(a.period_start).getTime()) || [];

  const payMutation = useMutation({
    mutationFn: (id: number) => hrApi.payPayroll(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hr", "payroll"] });
      toast({
        title: "Payroll Paid",
        description: "The employee's payroll has been marked as paid.",
      });
    },
    onError: (e: any) => {
      toast({
        title: "Error paying payroll",
        description: e.response?.data?.detail || "Something went wrong.",
        variant: "destructive",
      });
    },
  });

  return (
    <DataPanel title="Payroll History" description="View and manage monthly salary payments.">
      {isLoading ? (
        <div className="text-center py-8 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Loading...</div>
      ) : employeePayroll.length === 0 ? (
        <div className="text-center py-12 text-slate-300">
          <Banknote className="h-12 w-12 mx-auto mb-2 opacity-20" />
          <p className="font-black text-[10px] uppercase tracking-widest">No payroll records found.</p>
        </div>
      ) : (
        <div className="space-y-4 pt-4">
          {employeePayroll.map((record) => (
            <div key={record.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 bg-white/50 backdrop-blur-sm border border-slate-100 rounded-[24px] gap-6 group hover:border-brand-primary/10 transition-all">
              <div>
                <p className="text-xs font-black text-slate-700">
                  {format(new Date(record.period_start), "MMMM yyyy")}
                </p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                  Gross: {formatCurrency(record.gross_amount)} | Deductions: {formatCurrency(record.deductions)}
                </p>
              </div>
              <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
                <div className="text-xl font-black text-brand-primary">
                  {formatCurrency(record.net_amount)}
                </div>
                {record.is_paid ? (
                  <Badge className="bg-emerald-50 text-emerald-600 border-none font-black text-[9px] uppercase tracking-widest flex items-center gap-1.5 px-3 py-1.5">
                    <CheckCircle2 className="h-3 w-3" /> Paid
                  </Badge>
                ) : (
                  <Button 
                    size="sm" 
                    className="bg-brand-primary text-white hover:bg-brand-primary/90 rounded-xl px-6 h-10 font-black text-[10px] uppercase tracking-widest shadow-lg shadow-brand-primary/20 transition-all"
                    onClick={() => payMutation.mutate(record.id)}
                    disabled={payMutation.isPending}
                  >
                    {payMutation.isPending ? "Updating..." : "Pay Now"}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </DataPanel>
  );
}
