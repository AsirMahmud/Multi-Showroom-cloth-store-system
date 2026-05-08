import axiosInstance from "@/lib/api/axios-config";
import type { AttendanceRecord, Employee, PayrollRecord } from "@/types/hr";

export const hrApi = {
  getEmployees: async (): Promise<Employee[]> => {
    const { data } = await axiosInstance.get("/branches/hr/employees/");
    return data;
  },
  getEmployeeById: async (id: number | string): Promise<Employee> => {
    const { data } = await axiosInstance.get(`/branches/hr/employees/${id}/`);
    return data;
  },
  createEmployee: async (payload: Partial<Employee>): Promise<Employee> => {
    const { data } = await axiosInstance.post("/branches/hr/employees/", payload);
    return data;
  },  getAttendance: async (): Promise<AttendanceRecord[]> => {
    const { data } = await axiosInstance.get("/branches/hr/attendance/");
    return data;
  },
  markAttendance: async (payload: Partial<AttendanceRecord>): Promise<AttendanceRecord> => {
    const { data } = await axiosInstance.post("/branches/hr/attendance/", payload);
    return data;
  },
  getPayroll: async (): Promise<PayrollRecord[]> => {
    const { data } = await axiosInstance.get("/branches/hr/payroll/");
    return data;
  },
  payPayroll: async (id: number): Promise<PayrollRecord> => {
    const { data } = await axiosInstance.patch(`/branches/hr/payroll/${id}/`, {
      is_paid: true,
    });
    return data;
  },
  runMonthlyPayroll: async (period?: string): Promise<{ period_start: string; created_records: number }> => {
    const { data } = await axiosInstance.post("/branches/hr/payroll/run-monthly/", {
      period,
    });
    return data;
  },
};
