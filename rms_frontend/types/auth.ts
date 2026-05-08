export type UserRole = "admin" | "branch_manager" | "hr";

/**
 * Permission codes that can appear in the JWT and the {@link AuthUser.permissions}
 * list. The string union is the source of truth — adding a new permission code
 * server-side requires adding it here too so the frontend gets type safety.
 */
export type PermissionCode =
  // Global resources
  | "manage_categories"
  | "manage_online_categories"
  | "manage_brands"
  | "manage_suppliers"
  | "manage_customers"
  | "view_customers"
  | "manage_discounts"
  | "manage_hero_slides"
  | "manage_promotional_modals"
  | "manage_home_page_settings"
  | "manage_product_status"
  | "manage_product_catalog"
  | "manage_expense_categories"
  // Branch operations
  | "view_sales"
  | "create_sale"
  | "void_sale"
  | "manage_due_payments"
  | "view_expenses"
  | "create_expense"
  | "approve_expense"
  | "view_inventory"
  | "add_stock"
  | "transfer_stock"
  | "view_employees"
  | "manage_employees"
  | "manage_attendance"
  | "manage_payroll"
  | "view_preorders"
  | "manage_preorders"
  | "manage_online_preorders"
  // System
  | "manage_branches"
  | "manage_accounts"
  | "manage_permissions"
  | "view_audit_log"
  | "flush_database"
  | "manage_settings"
  | "view_reports"
  | "export_data";

export interface AuthUser {
  username: string;
  role: UserRole;
  managedBranchId: number | null;
  branchIds: number[];
  permissions: string[];
}

export interface AuthResponse {
  access: string;
  refresh: string;
  role: UserRole;
  managed_branch_id: number | null;
  branch_ids: number[];
  permissions: string[];
  username: string;
}
