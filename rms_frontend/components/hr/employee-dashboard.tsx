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
  Clock
} from "lucide-react";

import { hrApi } from "@/lib/api/hr";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAttendance } from "@/hooks/queries/use-hr";

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
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-slate-800">Employee not found</h2>
        <p className="text-slate-500">The employee record does not exist or you don't have access.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6 items-start">
        <div className="flex items-center gap-4 bg-white p-6 rounded-xl border shadow-sm flex-1 w-full">
          <div className="h-20 w-20 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700">
            <User className="h-10 w-10" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#163625]">{employee.full_name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge className="bg-[#E4FCD5] text-[#163625] hover:bg-[#E4FCD5]">
                {employee.designation || "Employee"}
              </Badge>
              <Badge variant={employee.is_active ? "default" : "secondary"} className={employee.is_active ? "bg-emerald-500" : ""}>
                {employee.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 w-full md:w-auto flex-1">
          <Card className="bg-white shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <Building2 className="h-5 w-5 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">Branch</p>
                <p className="font-medium text-slate-800">{employee.branch_name || employee.branch}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">Base Salary</p>
                <p className="font-medium text-slate-800">
                  ${parseFloat(employee.base_salary).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-white border mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="attendance">Attendance Record</TabsTrigger>
          <TabsTrigger value="payroll">Payroll</TabsTrigger>
          <TabsTrigger value="documents" disabled>Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <div>
                    <p className="text-sm text-slate-500">Email Address</p>
                    <p className="font-medium">{employee.email || "Not provided"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-slate-400" />
                  <div>
                    <p className="text-sm text-slate-500">Phone Number</p>
                    <p className="font-medium">{employee.phone || "Not provided"}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Briefcase className="h-4 w-4 text-slate-400" />
                  <div>
                    <p className="text-sm text-slate-500">Designation</p>
                    <p className="font-medium">{employee.designation || "Not specified"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <CalendarDays className="h-4 w-4 text-slate-400" />
                  <div>
                    <p className="text-sm text-slate-500">Hire Date</p>
                    <p className="font-medium">
                      {employee.hire_date ? format(new Date(employee.hire_date), "MMMM d, yyyy") : "Not recorded"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Attendance</CardTitle>
              <CardDescription>A history of recent check-ins and statuses.</CardDescription>
            </CardHeader>
            <CardContent>
              {isAttendanceLoading ? (
                <div className="text-center py-4 text-muted-foreground">Loading attendance...</div>
              ) : employeeAttendance.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border rounded-lg bg-slate-50 border-dashed">
                  <Clock className="h-8 w-8 mx-auto mb-2 text-slate-400" />
                  <p>No attendance records found for this employee.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {employeeAttendance.slice(0, 15).map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <CalendarDays className="h-4 w-4 text-slate-500" />
                        <span className="font-medium">{format(new Date(record.date), "MMMM d, yyyy")}</span>
                      </div>
                      <Badge 
                        variant={record.status === 'present' ? 'default' : record.status === 'absent' ? 'destructive' : 'secondary'}
                        className={
                          record.status === 'present' ? 'bg-emerald-500 hover:bg-emerald-600' :
                          record.status === 'late' ? 'bg-amber-500 hover:bg-amber-600 text-white' :
                          record.status === 'leave' ? 'bg-blue-500 hover:bg-blue-600 text-white' : ''
                        }
                      >
                        {record.status.toUpperCase()}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payroll">
          <EmployeePayrollTab employeeId={employeeId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

import { usePayroll } from "@/hooks/queries/use-hr";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Banknote, CheckCircle2 } from "lucide-react";

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
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Payroll Records</CardTitle>
        <CardDescription>Manage and pay monthly salaries.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-4 text-muted-foreground">Loading payroll...</div>
        ) : employeePayroll.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border rounded-lg bg-slate-50 border-dashed">
            <Banknote className="h-8 w-8 mx-auto mb-2 text-slate-400" />
            <p>No payroll records found for this employee.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {employeePayroll.map((record) => (
              <div key={record.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-slate-50 rounded-lg border gap-4">
                <div>
                  <p className="font-semibold text-slate-800">
                    {format(new Date(record.period_start), "MMMM yyyy")}
                  </p>
                  <p className="text-sm text-slate-500">
                    Gross: ${record.gross_amount} | Deductions: ${record.deductions}
                  </p>
                </div>
                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                  <div className="text-lg font-bold text-[#163625]">
                    ${record.net_amount}
                  </div>
                  {record.is_paid ? (
                    <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Paid
                    </Badge>
                  ) : (
                    <Button 
                      size="sm" 
                      className="bg-[#163625] hover:bg-[#1a402d]"
                      onClick={() => payMutation.mutate(record.id)}
                      disabled={payMutation.isPending}
                    >
                      {payMutation.isPending ? "Processing..." : "Mark as Paid"}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
