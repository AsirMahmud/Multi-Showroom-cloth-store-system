import axiosInstance from "@/lib/api/axios-config";
import type { AttendanceRecord, Employee, PayrollRecord, SalaryComponent, EmployeeSalaryStructure, LeaveRequest } from "@/types/hr";

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
  },
  getEmployeeHRProfile: async (id: number | string): Promise<Employee> => {
    const { data } = await axiosInstance.get(`/branches/hr/employees/${id}/hr-profile/`);
    return data;
  },
  runIndividualPayroll: async (id: number | string, period?: string): Promise<PayrollRecord> => {
    const { data } = await axiosInstance.post(`/branches/hr/employees/${id}/run-payroll/`, { period });
    return data;
  },
  getAttendance: async (): Promise<AttendanceRecord[]> => {
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
  
  // Salary Components
  getSalaryComponents: async (): Promise<SalaryComponent[]> => {
    const { data } = await axiosInstance.get("/branches/hr/salary-components/");
    return data;
  },
  
  // Salary Structures
  getSalaryStructures: async (employeeId?: number): Promise<EmployeeSalaryStructure[]> => {
    const params = employeeId ? { employee: employeeId } : {};
    const { data } = await axiosInstance.get("/branches/hr/salary-structures/", { params });
    return data;
  },
  createSalaryStructure: async (payload: Partial<EmployeeSalaryStructure>): Promise<EmployeeSalaryStructure> => {
    const { data } = await axiosInstance.post("/branches/hr/salary-structures/", payload);
    return data;
  },
  
  // Leave Requests
  getLeaveRequests: async (): Promise<LeaveRequest[]> => {
    const { data } = await axiosInstance.get("/branches/hr/leave-requests/");
    return data;
  },
  createLeaveRequest: async (payload: Partial<LeaveRequest>): Promise<LeaveRequest> => {
    const { data } = await axiosInstance.post("/branches/hr/leave-requests/", payload);
    return data;
  },
  approveLeaveRequest: async (id: number): Promise<any> => {
    const { data } = await axiosInstance.post(`/branches/hr/leave-requests/${id}/approve/`);
    return data;
  },
  rejectLeaveRequest: async (id: number): Promise<any> => {
    const { data } = await axiosInstance.post(`/branches/hr/leave-requests/${id}/reject/`);
    return data;
  },
};
