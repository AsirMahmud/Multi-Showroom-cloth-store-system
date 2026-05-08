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
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Users, Briefcase, Download, X, Building2 } from "lucide-react";
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

  const clearSearch = () => setSearchTerm("");

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-50 via-[#E4FCD5]/10 to-[#163625]/5">
      <div className="p-6 space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[#163625] to-[#2a6646] bg-clip-text text-transparent flex items-center gap-3">
              <Users className="h-8 w-8 text-[#163625]" />
              Employee Directory
            </h1>
            <p className="text-lg text-slate-600">
              Manage branch staff, view detailed profiles, and oversee attendance.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              className="bg-white border-slate-200 shadow-sm hover:bg-slate-50 text-[#163625]"
              disabled={isLoading}
            >
              <Download className="w-4 h-4 mr-2" />
              Export Roster
            </Button>
            <AddEmployeeDialog />
          </div>
        </div>

        {/* Filters and Search */}
        <Card className="bg-white border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <Input
                    placeholder="Search employees by name, designation, email, or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-10 h-12 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                  />
                  {searchTerm && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearSearch}
                        className="h-6 w-6 p-0 hover:bg-slate-200 text-slate-500"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>
                {searchTerm && (
                  <div className="mt-2 text-sm text-slate-600">
                    Found {filteredEmployees?.length || 0} results for "{searchTerm}"
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Table */}
        <Card className="border-0 shadow-lg overflow-hidden bg-white">
          <Table>
            <TableHeader className="bg-[#163625] hover:bg-[#163625]">
              <TableRow className="hover:bg-[#163625]">
                <TableHead className="font-semibold text-white py-4">Employee Info</TableHead>
                <TableHead className="font-semibold text-white py-4">Designation</TableHead>
                <TableHead className="font-semibold text-white py-4">Branch</TableHead>
                <TableHead className="font-semibold text-white py-4">Status</TableHead>
                <TableHead className="font-semibold text-white py-4 text-right">Base Salary</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <>
                  {[...Array(5)].map((_, i) => (
                    <TableRow key={i} className="border-slate-100">
                      <TableCell><Skeleton className="h-10 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20 ml-auto" /></TableCell>
                    </TableRow>
                  ))}
                </>
              ) : filteredEmployees?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-[400px] text-center">
                    <div className="flex flex-col items-center justify-center space-y-3 text-slate-500">
                      <Users className="h-12 w-12 text-slate-300" />
                      <p className="text-lg font-medium">No employees found.</p>
                      <p className="text-sm">Try adjusting your search or add a new employee.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredEmployees?.map((employee) => (
                  <TableRow 
                    key={employee.id} 
                    className="hover:bg-slate-50 cursor-pointer transition-colors border-slate-100"
                    onClick={() => router.push(`/hr/employees/${employee.id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-[#E4FCD5] flex items-center justify-center text-[#163625] font-bold">
                          {employee.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-[#163625]">{employee.full_name}</p>
                          <p className="text-xs text-slate-500 flex items-center gap-1">
                            {employee.phone || employee.email || "No contact info"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-slate-700">
                        <Briefcase className="h-4 w-4 text-slate-400" />
                        {employee.designation || "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-slate-700">
                        <Building2 className="h-4 w-4 text-slate-400" />
                        {employee.branch_name || employee.branch}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={employee.is_active ? "default" : "secondary"} className={employee.is_active ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-200" : ""}>
                        {employee.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-right text-slate-700">
                      ${parseFloat(employee.base_salary).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
