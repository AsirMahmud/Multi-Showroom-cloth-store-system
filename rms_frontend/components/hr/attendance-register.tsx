"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Calendar as CalendarIcon, 
  Search, 
  UserCheck, 
  ChevronLeft, 
  ChevronRight,
  Download,
  Filter,
  Activity,
  ArrowRight
} from "lucide-react";
import { format, addDays, subDays } from "date-fns";

import { hrApi } from "@/lib/api/hr";
import { useEmployees, useAttendance } from "@/hooks/queries/use-hr";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { MetricCard, DataPanel, PageHeader } from "@/components/ui/professional";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

export function AttendanceRegister() {
  const { data: employees, isLoading: employeesLoading } = useEmployees();
  const { data: attendance, isLoading: attendanceLoading } = useAttendance();
  const qc = useQueryClient();
  const { toast } = useToast();
  
  const [date, setDate] = useState<Date>(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const dateStr = format(date, "yyyy-MM-dd");

  const markMutation = useMutation({
    mutationFn: (data: { employee: number; status: string; date: string }) =>
      hrApi.markAttendance(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hr", "attendance"] });
      toast({
        title: "Attendance Recorded",
        description: "The attendance status has been updated.",
      });
    },
    onError: (e: any) => {
      toast({
        title: "Error recording attendance",
        description: e.response?.data?.detail || "Something went wrong.",
        variant: "destructive",
      });
    },
  });

  const getAttendanceForEmployee = (empId: number) => {
    return attendance?.find((a) => a.employee === empId && a.date === dateStr);
  };

  const handleMark = (empId: number, status: string) => {
    markMutation.mutate({
      employee: empId,
      status,
      date: dateStr,
    });
  };

  const filteredEmployees = employees?.filter(emp => 
    emp.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.designation?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const todayAttendance = attendance?.filter(a => a.date === dateStr) || [];
  const presentCount = todayAttendance.filter(a => a.status === "present").length;
  const absentCount = todayAttendance.filter(a => a.status === "absent").length;
  const lateCount = todayAttendance.filter(a => a.status === "late").length;
  const leaveCount = todayAttendance.filter(a => a.status === "leave").length;

  const navigateDate = (direction: 'next' | 'prev') => {
    setDate(prev => direction === 'next' ? addDays(prev, 1) : subDays(prev, 1));
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Personnel Presence"
        description={`Monitoring and recording daily staff presence for ${format(date, "MMMM d, yyyy")}.`}
        icon={<UserCheck className="h-5 w-5" />}
        action={
          <div className="flex items-center gap-3 bg-white/50 backdrop-blur-md p-1.5 rounded-2xl shadow-sm border border-slate-100">
            <Button variant="ghost" size="icon" onClick={() => navigateDate('prev')} className="h-8 w-8 rounded-xl hover:bg-white transition-all">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="px-3 font-black text-[10px] uppercase tracking-widest text-brand-primary min-w-[120px] text-center">
              {format(date, "eee, MMM d")}
            </div>
            <Button variant="ghost" size="icon" onClick={() => navigateDate('next')} disabled={dateStr === format(new Date(), "yyyy-MM-dd")} className="h-8 w-8 rounded-xl hover:bg-white transition-all">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div variants={item}>
          <MetricCard
            label="Active Personnel"
            value={presentCount.toString()}
            icon={<CheckCircle2 className="h-5 w-5" />}
            tone="emerald"
            helper="Present on duty"
          />
        </motion.div>
        <motion.div variants={item}>
          <MetricCard
            label="Critical Absence"
            value={absentCount.toString()}
            icon={<XCircle className="h-5 w-5" />}
            tone="rose"
            helper="Unreported leave"
          />
        </motion.div>
        <motion.div variants={item}>
          <MetricCard
            label="Temporal Latency"
            value={lateCount.toString()}
            icon={<Clock className="h-5 w-5" />}
            tone="amber"
            helper="Arrival delay log"
          />
        </motion.div>
        <motion.div variants={item}>
          <MetricCard
            label="Approved Furlough"
            value={leaveCount.toString()}
            icon={<CalendarIcon className="h-5 w-5" />}
            tone="indigo"
            helper="Scheduled leave nodes"
          />
        </motion.div>
      </div>

      <DataPanel title="Associate Matrix" description="Granular log of personnel presence and deployment status.">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input 
              placeholder="Search identity..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11 bg-slate-50/50 border-slate-100 rounded-2xl focus:ring-brand-primary/20 transition-all font-bold text-xs"
            />
          </div>
          <Button variant="outline" className="h-11 px-6 rounded-2xl flex items-center gap-2 font-black text-[10px] uppercase tracking-widest border-slate-100 bg-white/50 hover:bg-white shadow-sm transition-all">
            <Download className="h-3.5 w-3.5" />
            Export Protocol
          </Button>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-slate-100 hover:bg-transparent">
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-6">Associate Identifier</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-6">Designation</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-6 text-center">Status</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-6 text-right">Settlement Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employeesLoading || attendanceLoading ? (
                <>
                  {[...Array(5)].map((_, i) => (
                    <TableRow key={i} className="border-slate-50">
                      <TableCell><Skeleton className="h-10 w-48 rounded-xl" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-32 rounded-lg" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20 mx-auto rounded-lg" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-64 ml-auto rounded-xl" /></TableCell>
                    </TableRow>
                  ))}
                </>
              ) : filteredEmployees?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-[300px] text-center">
                    <div className="flex flex-col items-center justify-center text-slate-300">
                      <Activity className="h-12 w-12 mb-2 opacity-20" />
                      <p className="font-black text-[10px] uppercase tracking-widest">No matching personnel nodes found.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredEmployees?.map((emp) => {
                  const record = getAttendanceForEmployee(emp.id);
                  return (
                    <TableRow key={emp.id} className="hover:bg-slate-50/50 transition-colors border-slate-50 group">
                      <TableCell className="py-5">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 border-2 border-white shadow-sm">
                            <AvatarFallback className="bg-brand-secondary text-brand-primary text-xs font-black">
                              {emp.full_name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs font-black text-slate-700">{emp.full_name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-5">
                        <Badge variant="secondary" className="bg-slate-100 text-slate-500 border-none font-bold text-[10px]">
                          {emp.designation || "Unassigned"}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-5 text-center">
                        {record ? (
                          <Badge 
                            className={cn(
                              "border-none font-black text-[9px] uppercase tracking-widest",
                              record.status === 'present' ? 'bg-emerald-50 text-emerald-600' :
                              record.status === 'absent' ? 'bg-rose-50 text-rose-600' :
                              record.status === 'late' ? 'bg-amber-50 text-amber-600' :
                              'bg-indigo-50 text-indigo-600'
                            )}
                          >
                            {record.status}
                          </Badge>
                        ) : (
                          <span className="text-slate-300 text-[9px] font-black uppercase tracking-widest italic">Pending Trace</span>
                        )}
                      </TableCell>
                      <TableCell className="py-5 text-right">
                        <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                            size="sm" 
                            variant="ghost"
                            className={cn(
                              "h-8 rounded-xl px-4 font-black text-[9px] uppercase tracking-widest transition-all",
                              record?.status === 'present' ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'text-emerald-600 hover:bg-emerald-50'
                            )}
                            onClick={() => handleMark(emp.id, 'present')}
                            disabled={markMutation.isPending || record?.status === 'present'}
                          >
                            Present
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            className={cn(
                              "h-8 rounded-xl px-4 font-black text-[9px] uppercase tracking-widest transition-all",
                              record?.status === 'absent' ? 'bg-rose-500 text-white hover:bg-rose-600' : 'text-rose-600 hover:bg-rose-50'
                            )}
                            onClick={() => handleMark(emp.id, 'absent')}
                            disabled={markMutation.isPending || record?.status === 'absent'}
                          >
                            Absent
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            className={cn(
                              "h-8 rounded-xl px-4 font-black text-[9px] uppercase tracking-widest transition-all",
                              record?.status === 'late' ? 'bg-amber-500 text-white hover:bg-amber-600' : 'text-amber-600 hover:bg-amber-50'
                            )}
                            onClick={() => handleMark(emp.id, 'late')}
                            disabled={markMutation.isPending || record?.status === 'late'}
                          >
                            Late
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </DataPanel>
    </div>
  );
}
