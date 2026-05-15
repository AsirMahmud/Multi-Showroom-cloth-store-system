export interface Branch {
  id: number;
  name: string;
  address: string;
  phone: string;
  receipt_header_title?: string;
  receipt_header_subtitle?: string;
  receipt_address?: string;
  receipt_phone?: string;
  receipt_footer_message?: string;
  receipt_return_policy?: string;
  is_active: boolean;
}

export interface StaffAccountPayload {
  username: string;
  email?: string;
  password: string;
  role: "admin" | "branch_manager" | "hr";
  managed_branch?: number | null;
  hr_branch_ids?: number[];
}

export interface Employee {
  id: number;
  branch: number;
  branch_name: string;
  full_name: string;
  email: string;
  phone: string;
  designation: string;
  base_salary: string;
  hire_date: string | null;
  is_active: boolean;
  salary_structures?: EmployeeSalaryStructure[];
  leave_requests?: LeaveRequest[];
  payroll_records?: PayrollRecord[];
}

export interface SalaryComponent {
  id: number;
  name: string;
  component_type: "earning" | "deduction";
  is_recurring: boolean;
  description: string;
}

export interface EmployeeSalaryStructure {
  id: number;
  employee: number;
  component: number;
  component_name: string;
  component_type: "earning" | "deduction";
  amount: string;
}

export interface LeaveRequest {
  id: number;
  employee: number;
  employee_name: string;
  leave_type: "sick" | "casual" | "vacation" | "unpaid";
  start_date: string;
  end_date: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  approved_by_name?: string;
}

export interface PayrollItem {
  id: number;
  payroll_record: number;
  component_name: string;
  component_type: "earning" | "deduction";
  amount: string;
}

export interface AttendanceRecord {
  id: number;
  employee: number;
  employee_name: string;
  branch: number;
  date: string;
  status: "present" | "absent" | "leave" | "late";
}

export interface PayrollRecord {
  id: number;
  employee: number;
  employee_name: string;
  branch: number;
  period_start: string;
  gross_amount: string;
  deductions: string;
  net_amount: string;
  is_paid: boolean;
  items?: PayrollItem[];
}

export interface Account {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: "admin" | "branch_manager" | "hr";
  managed_branch: number | null;
  managed_branch_name: string | null;
  hr_branch_ids: number[];
  hr_branch_names: string[];
  is_active: boolean;
  is_superuser: boolean;
  last_login: string | null;
  date_joined: string;
}

export interface AccountUpdatePayload {
  email?: string;
  first_name?: string;
  last_name?: string;
  role?: "admin" | "branch_manager" | "hr";
  managed_branch?: number | null;
  hr_branch_ids?: number[];
  is_active?: boolean;
}
