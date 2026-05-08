"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  CalendarCheck,
  CircleDollarSign,
  Users,
  LayoutDashboard,
  UserPlus,
  ClipboardList,
  Wallet,
  TrendingUp,
  UserCheck,
  Clock,
  ArrowUpRight,
  ChevronRight
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { hrApi } from "@/lib/api/hr";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ManagerDirectory } from "@/components/hr/manager-directory";

export function HRDashboard() {
  const { data: employees, isLoading: employeesLoading } = useQuery({
    queryKey: ["hr", "employees"],
    queryFn: hrApi.getEmployees,
  });
  const { data: attendance, isLoading: attendanceLoading } = useQuery({
    queryKey: ["hr", "attendance"],
    queryFn: hrApi.getAttendance,
  });
  const { data: payroll, isLoading: payrollLoading } = useQuery({
    queryKey: ["hr", "payroll"],
    queryFn: hrApi.getPayroll,
  });

  const today = new Date().toISOString().slice(0, 10);
  const todayPresent = (attendance ?? []).filter(
    (a) => a.date === today && a.status === "present"
  ).length;
  const totalEmployees = employees?.length ?? 0;
  const pendingPayroll = (payroll ?? []).filter((p) => !p.is_paid).length;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-50 via-[#E4FCD5]/10 to-[#163625]/5 p-6 space-y-8">
      
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[#163625] to-[#2a6646] bg-clip-text text-transparent flex items-center gap-3">
            <LayoutDashboard className="h-8 w-8 text-[#163625]" />
            HR Overview
          </h1>
          <p className="text-lg text-slate-600">
            Monitor staff performance, attendance trends, and payroll status.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/hr/employees">
            <Button className="bg-[#163625] hover:bg-[#1a402d] shadow-lg flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Add Employee
            </Button>
          </Link>
          <Link href="/hr/attendance">
            <Button variant="outline" className="border-[#163625] text-[#163625] hover:bg-emerald-50 shadow-sm flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Mark Attendance
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          href="/hr/employees"
          icon={<Users className="h-6 w-6" />}
          label="Total Workforce"
          value={employeesLoading ? null : totalEmployees}
          description="Active employees across all roles"
        />
        <StatCard
          href="/hr/attendance"
          icon={<CalendarCheck className="h-6 w-6" />}
          label="Today's Attendance"
          value={attendanceLoading ? null : todayPresent}
          description="Staff present at their stations today"
        />
        <StatCard
          href="/hr/payroll"
          icon={<CircleDollarSign className="h-6 w-6" />}
          label="Pending Payments"
          value={payrollLoading ? null : pendingPayroll}
          description="Payroll records awaiting processing"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Activities Section */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-0 shadow-xl overflow-hidden bg-white">
            <CardHeader className="border-b pb-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl text-[#163625]">Recent Management Activity</CardTitle>
                  <CardDescription>Key actions and updates from your branch managers.</CardDescription>
                </div>
                <TrendingUp className="h-5 w-5 text-emerald-500" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                <ActivityItem 
                  icon={<UserPlus className="h-4 w-4 text-emerald-600" />}
                  title="New Employee Onboarded"
                  time="2 hours ago"
                  description="Sarah Jenkins was added to the Downtown Branch as a Senior Sales Associate."
                  bg="bg-emerald-50"
                />
                <ActivityItem 
                  icon={<Wallet className="h-4 w-4 text-blue-600" />}
                  title="Payroll Generated"
                  time="5 hours ago"
                  description="Monthly payroll records for May 2024 have been generated for all active staff."
                  bg="bg-blue-50"
                />
                <ActivityItem 
                  icon={<Clock className="h-4 w-4 text-amber-600" />}
                  title="Attendance Lockdown"
                  time="Yesterday"
                  description="Attendance logs for yesterday have been finalized and reviewed by HR."
                  bg="bg-amber-50"
                />
              </div>
              <div className="p-4 border-t bg-slate-50/50 text-center">
                <Button variant="ghost" className="text-[#163625] hover:text-[#2a6646] text-sm font-medium">
                  View Full Audit Log <ArrowUpRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-white p-6">
            <ManagerDirectory />
          </Card>
        </div>

        {/* Right Sidebar - Quick Access */}
        <div className="space-y-6">
          <Card className="border-0 shadow-xl bg-[#163625] text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Wallet className="h-24 w-24" />
            </div>
            <CardHeader>
              <CardTitle className="text-lg">Payroll Status</CardTitle>
              <CardDescription className="text-emerald-100/70">Next run in 12 days</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 relative z-10">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-3xl font-bold">$12,450</p>
                  <p className="text-xs text-emerald-100/60 uppercase tracking-wider">Total Est. Monthly</p>
                </div>
                <Badge className="bg-emerald-500 text-white hover:bg-emerald-600 border-0">On Track</Badge>
              </div>
              <Link href="/hr/payroll">
                <Button className="w-full bg-white text-[#163625] hover:bg-emerald-50 mt-4 border-0">
                  Review All Payroll
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-white overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-[#163625]">HR Resources</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ResourceLink icon={<ClipboardList className="h-4 w-4" />} title="HR Guidelines" />
              <ResourceLink icon={<Users className="h-4 w-4" />} title="Org Chart" />
              <ResourceLink icon={<CalendarCheck className="h-4 w-4" />} title="Holiday Calendar" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatCard({ href, icon, label, value, description }: any) {
  return (
    <Link href={href} className="group">
      <Card className="overflow-hidden border-0 shadow-lg bg-white transition-all hover:translate-y-[-4px]">
        <CardContent className="p-0">
          <div className="flex items-stretch h-32">
            <div className="flex-1 p-6 flex flex-col justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
                {value === null ? (
                  <Skeleton className="h-9 w-16 mt-1" />
                ) : (
                  <p className="text-4xl font-bold text-[#163625] mt-1">{value}</p>
                )}
              </div>
              <p className="text-xs text-slate-400 font-medium leading-tight">{description}</p>
            </div>
            <div className="w-20 bg-emerald-50 flex items-center justify-center group-hover:bg-[#E4FCD5] transition-colors">
              <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-[#163625] group-hover:scale-110 transition-transform">
                {icon}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function ActivityItem({ icon, title, time, description, bg }: any) {
  return (
    <div className="p-6 hover:bg-slate-50 transition-colors flex gap-4">
      <div className={`h-10 w-10 shrink-0 rounded-xl ${bg} flex items-center justify-center`}>
        {icon}
      </div>
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-slate-800">{title}</p>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{time}</span>
        </div>
        <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function ResourceLink({ icon, title }: any) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all cursor-pointer group">
      <div className="flex items-center gap-3">
        <div className="text-slate-400 group-hover:text-[#163625] transition-colors">
          {icon}
        </div>
        <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900">{title}</span>
      </div>
      <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-[#163625] transition-transform group-hover:translate-x-1" />
    </div>
  );
}
