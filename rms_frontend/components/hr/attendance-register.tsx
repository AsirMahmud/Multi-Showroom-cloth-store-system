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
  Filter
} from "lucide-react";
import { format, addDays, subDays } from "date-fns";

import { hrApi } from "@/lib/api/hr";
import { useEmployees, useAttendance } from "@/hooks/queries/use-hr";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-50 via-[#E4FCD5]/10 to-[#163625]/5">
      <div className="p-6 space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[#163625] to-[#2a6646] bg-clip-text text-transparent flex items-center gap-3">
              <UserCheck className="h-8 w-8 text-[#163625]" />
              Attendance Register
            </h1>
            <p className="text-lg text-slate-600">
              Monitor and record daily staff presence for {format(date, "MMMM d, yyyy")}.
            </p>
          </div>
          
          <div className="flex items-center gap-3 bg-white p-1 rounded-xl shadow-sm border border-slate-200">
            <Button variant="ghost" size="icon" onClick={() => navigateDate('prev')}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="px-4 font-semibold text-[#163625] min-w-[140px] text-center">
              {format(date, "eee, MMM d")}
            </div>
            <Button variant="ghost" size="icon" onClick={() => navigateDate('next')} disabled={dateStr === format(new Date(), "yyyy-MM-dd")}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white border-0 shadow-md border-l-4 border-l-emerald-500 overflow-hidden group hover:shadow-lg transition-all">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Present Today</p>
                <p className="text-3xl font-bold text-emerald-600">{presentCount}</p>
              </div>
              <div className="h-12 w-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                <CheckCircle2 className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-0 shadow-md border-l-4 border-l-rose-500 overflow-hidden group hover:shadow-lg transition-all">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Absent Today</p>
                <p className="text-3xl font-bold text-rose-600">{absentCount}</p>
              </div>
              <div className="h-12 w-12 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 group-hover:scale-110 transition-transform">
                <XCircle className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-0 shadow-md border-l-4 border-l-amber-500 overflow-hidden group hover:shadow-lg transition-all">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Late Arrivals</p>
                <p className="text-3xl font-bold text-amber-600">{lateCount}</p>
              </div>
              <div className="h-12 w-12 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                <Clock className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-0 shadow-md border-l-4 border-l-blue-500 overflow-hidden group hover:shadow-lg transition-all">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">On Approved Leave</p>
                <p className="text-3xl font-bold text-blue-600">{leaveCount}</p>
              </div>
              <div className="h-12 w-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                <CalendarIcon className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Card */}
        <Card className="border-0 shadow-xl bg-white overflow-hidden">
          <CardHeader className="bg-white border-b pb-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <CardTitle className="text-2xl text-[#163625]">Staff Attendance List</CardTitle>
                <CardDescription>Mark attendance for each employee in this branch.</CardDescription>
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    placeholder="Filter by name..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 bg-slate-50 border-slate-200"
                  />
                </div>
                <Button variant="outline" className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-[#163625]">
                <TableRow className="hover:bg-[#163625]">
                  <TableHead className="text-white font-semibold py-4 pl-6">Employee</TableHead>
                  <TableHead className="text-white font-semibold py-4">Designation</TableHead>
                  <TableHead className="text-white font-semibold py-4 text-center">Status</TableHead>
                  <TableHead className="text-white font-semibold py-4 text-right pr-6">Record Attendance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employeesLoading || attendanceLoading ? (
                  <>
                    {[...Array(5)].map((_, i) => (
                      <TableRow key={i} className="border-slate-100">
                        <TableCell className="pl-6"><Skeleton className="h-10 w-48" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-20 mx-auto" /></TableCell>
                        <TableCell className="pr-6"><Skeleton className="h-8 w-64 ml-auto" /></TableCell>
                      </TableRow>
                    ))}
                  </>
                ) : filteredEmployees?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-[300px] text-center">
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <UserCheck className="h-12 w-12 mb-2 opacity-20" />
                        <p>No staff members found matching your search.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEmployees?.map((emp) => {
                    const record = getAttendanceForEmployee(emp.id);
                    return (
                      <TableRow key={emp.id} className="hover:bg-slate-50 transition-colors border-slate-100">
                        <TableCell className="pl-6">
                          <div className="flex items-center gap-3 py-1">
                            <div className="h-9 w-9 rounded-full bg-[#E4FCD5] flex items-center justify-center text-[#163625] font-bold">
                              {emp.full_name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-semibold text-[#163625]">{emp.full_name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-600 font-medium">
                          {emp.designation || "-"}
                        </TableCell>
                        <TableCell className="text-center">
                          {record ? (
                            <Badge 
                              className={
                                record.status === 'present' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                                record.status === 'absent' ? 'bg-rose-100 text-rose-800 border-rose-200' :
                                record.status === 'late' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                                'bg-blue-100 text-blue-800 border-blue-200'
                              }
                              variant="outline"
                            >
                              {record.status.toUpperCase()}
                            </Badge>
                          ) : (
                            <span className="text-slate-300 text-xs font-medium uppercase tracking-wider">Pending</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <div className="flex justify-end gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className={`rounded-full px-4 h-8 ${record?.status === 'present' ? 'bg-emerald-600 text-white border-emerald-600' : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'}`}
                              onClick={() => handleMark(emp.id, 'present')}
                              disabled={markMutation.isPending || record?.status === 'present'}
                            >
                              Present
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className={`rounded-full px-4 h-8 ${record?.status === 'absent' ? 'bg-rose-600 text-white border-rose-600' : 'border-rose-200 text-rose-700 hover:bg-rose-50'}`}
                              onClick={() => handleMark(emp.id, 'absent')}
                              disabled={markMutation.isPending || record?.status === 'absent'}
                            >
                              Absent
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className={`rounded-full px-4 h-8 ${record?.status === 'late' ? 'bg-amber-600 text-white border-amber-600' : 'border-amber-200 text-amber-700 hover:bg-amber-50'}`}
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
