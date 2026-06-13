"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { hrApi } from "@/lib/api/hr";
import { useBranch } from "@/contexts/branch-context";

export function useEmployees() {
  const { selectedBranchId } = useBranch();
  return useQuery({
    queryKey: ["hr", "employees", selectedBranchId],
    queryFn: hrApi.getEmployees,
  });
}

export function useAttendance() {
  const { selectedBranchId } = useBranch();
  return useQuery({
    queryKey: ["hr", "attendance", selectedBranchId],
    queryFn: hrApi.getAttendance,
  });
}

export function usePayroll() {
  const { selectedBranchId } = useBranch();
  return useQuery({
    queryKey: ["hr", "payroll", selectedBranchId],
    queryFn: hrApi.getPayroll,
  });
}

export function useRunPayroll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (period?: string) => hrApi.runMonthlyPayroll(period),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hr", "payroll"] }),
  });
}

export function useEmployeeHRProfile(id: number | string) {
  return useQuery({
    queryKey: ["hr", "employee-profile", id],
    queryFn: () => hrApi.getEmployeeHRProfile(id),
    enabled: !!id,
  });
}

export function useRunIndividualPayroll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, period }: { id: number | string; period?: string }) => 
      hrApi.runIndividualPayroll(id, period),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ["hr", "payroll"] });
      qc.invalidateQueries({ queryKey: ["hr", "employee-profile", id] });
    },
  });
}

export function useSalaryComponents() {
  return useQuery({
    queryKey: ["hr", "salary-components"],
    queryFn: hrApi.getSalaryComponents,
  });
}

export function useSalaryStructures(employeeId?: number) {
  return useQuery({
    queryKey: ["hr", "salary-structures", employeeId],
    queryFn: () => hrApi.getSalaryStructures(employeeId),
  });
}

export function useLeaveRequests() {
  return useQuery({
    queryKey: ["hr", "leave-requests"],
    queryFn: hrApi.getLeaveRequests,
  });
}

export function useApproveLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: hrApi.approveLeaveRequest,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hr", "leave-requests"] });
    },
  });
}

export function useSettlePayroll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: hrApi.payPayroll,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hr", "payroll"] });
    },
  });
}
