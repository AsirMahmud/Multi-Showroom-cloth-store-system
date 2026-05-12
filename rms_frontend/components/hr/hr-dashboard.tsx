"use client";

import { useQuery } from "@tanstack/react-query";
import { 
  Users, 
  UserPlus, 
  UserCheck, 
  CalendarCheck, 
  CircleDollarSign, 
  Wallet, 
  ArrowUpRight,
  ClipboardList
} from "lucide-react";
import { PageHeader, MetricCard, DataPanel } from "@/components/ui/professional";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { motion } from "framer-motion";
import { ManagerDirectory } from "@/components/hr/manager-directory";
import { hrApi } from "@/lib/api/hr";

// Helper components that were likely defined in the file or need to be
function ActivityItem({ icon, title, time, description, bg }: any) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors group">
      <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-900 truncate">{title}</h4>
          <span className="text-[10px] font-bold text-slate-400 shrink-0">{time}</span>
        </div>
        <p className="text-xs text-slate-500 mt-1 line-clamp-1">{description}</p>
      </div>
    </div>
  );
}

function ResourceLink({ icon, title }: any) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-all group cursor-pointer border border-transparent hover:border-brand-primary/5">
      <div className="flex items-center gap-3">
        <div className="text-slate-400 group-hover:text-brand-primary transition-colors">
          {icon}
        </div>
        <span className="text-[11px] font-bold text-slate-600 group-hover:text-brand-primary transition-colors uppercase tracking-wider">{title}</span>
      </div>
      <ArrowUpRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-brand-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
    </div>
  );
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

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
  const { data: leaves, isLoading: leavesLoading } = useQuery({
    queryKey: ["hr", "leave-requests"],
    queryFn: hrApi.getLeaveRequests,
  });

  const today = new Date().toISOString().slice(0, 10);
  const todayPresent = (attendance ?? []).filter((a) => a.date === today && a.status === "present").length;
  const totalEmployees = employees?.length ?? 0;
  const pendingPayroll = (payroll ?? []).filter((p) => !p.is_paid).length;
  const pendingLeaves = (leaves ?? []).filter((l) => l.status === "pending").length;

  if (employeesLoading || attendanceLoading || payrollLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64 rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-[24px]" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-[500px] rounded-[32px]" />
          <Skeleton className="h-[500px] rounded-[32px]" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      <PageHeader
        title="Human Resources"
        description="Global workforce management, attendance tracking, and payroll engine."
        icon={<Users className="h-6 w-6" />}
        actions={
          <div className="flex gap-2">
            <Button
              asChild
              className="h-10 px-4 bg-brand-primary text-brand-secondary hover:bg-emerald-900 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-brand-primary/20"
            >
              <Link href="/hr/employees">
                <UserPlus className="h-3.5 w-3.5 mr-2" />
                Add Staff
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-10 px-4 bg-white border-brand-primary/5 shadow-sm rounded-xl font-bold text-xs uppercase tracking-widest text-brand-primary hover:bg-slate-50"
            >
              <Link href="/hr/attendance">
                <UserCheck className="h-3.5 w-3.5 mr-2" />
                Attendance
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-10 px-4 bg-white border-brand-primary/5 shadow-sm rounded-xl font-bold text-xs uppercase tracking-widest text-brand-primary hover:bg-slate-50"
            >
              <Link href="/hr/leaves">
                <ClipboardList className="h-3.5 w-3.5 mr-2" />
                Leaves
              </Link>
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div variants={item}>
          <MetricCard
            label="Total Workforce"
            value={totalEmployees}
            icon={<Users className="h-5 w-5" />}
            tone="brand"
            helper="Active employees"
          />
        </motion.div>
        <motion.div variants={item}>
          <MetricCard
            label="Today's Turnout"
            value={todayPresent}
            icon={<CalendarCheck className="h-5 w-5" />}
            tone="emerald"
            helper={`${totalEmployees > 0 ? Math.round((todayPresent / totalEmployees) * 100) : 0}% Attendance Rate`}
          />
        </motion.div>
        <motion.div variants={item}>
          <MetricCard
            label="Pending Leaves"
            value={pendingLeaves}
            icon={<ClipboardList className="h-5 w-5" />}
            tone="indigo"
            helper="Needs approval"
          />
        </motion.div>
        <motion.div variants={item}>
          <MetricCard
            label="Pending Payroll"
            value={pendingPayroll}
            icon={<CircleDollarSign className="h-5 w-5" />}
            tone="rose"
            helper="Records to process"
          />
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <motion.div variants={item}>
            <DataPanel title="Recent HR Activity" description="Key updates from managers and automated system logs.">
              <div className="space-y-4">
                <ActivityItem 
                  icon={<UserPlus className="h-4 w-4 text-emerald-600" />}
                  title="New Employee Onboarded"
                  time="2h ago"
                  description="Sarah Jenkins joined as Senior Sales Associate."
                  bg="bg-emerald-50"
                />
                <ActivityItem 
                  icon={<Wallet className="h-4 w-4 text-brand-primary" />}
                  title="Payroll Batch Generated"
                  time="5h ago"
                  description="Monthly payroll records for June 2024 are ready."
                  bg="bg-slate-50"
                />
              </div>
              <div className="mt-6 flex justify-center">
                <Button variant="ghost" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-brand-primary">
                  View Full Logs <ArrowUpRight className="ml-2 h-3.5 w-3.5" />
                </Button>
              </div>
            </DataPanel>
          </motion.div>

          <motion.div variants={item}>
            <ManagerDirectory />
          </motion.div>
        </div>

        <div className="space-y-6">
          <motion.div variants={item}>
            <div className="p-8 rounded-[32px] bg-brand-primary text-brand-secondary shadow-xl relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
                <Wallet className="h-32 w-32" />
              </div>
              <div className="relative z-10 space-y-6">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest opacity-60">Estimated Payroll</h3>
                  <p className="text-3xl font-black mt-2 tracking-tight">$12,450.00</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-none rounded-lg text-[10px] font-black uppercase tracking-widest">On Track</Badge>
                  <span className="text-[10px] font-bold opacity-60">Next run in 12 days</span>
                </div>
                <Button asChild className="w-full bg-brand-secondary text-brand-primary hover:bg-white rounded-xl font-bold text-xs uppercase tracking-widest py-6">
                  <Link href="/hr/payroll">Review Engine</Link>
                </Button>
              </div>
            </div>
          </motion.div>

          <motion.div variants={item}>
            <DataPanel title="HR Toolkit" description="Access vital documents and calendars.">
              <div className="space-y-2">
                <ResourceLink icon={<ClipboardList className="h-4 w-4" />} title="Guidelines" />
                <ResourceLink icon={<Users className="h-4 w-4" />} title="Org Hierarchy" />
                <ResourceLink icon={<CalendarCheck className="h-4 w-4" />} title="Holidays" />
              </div>
            </DataPanel>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
