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
