import { RoleGuard } from "@/components/auth/role-guard";
import { AttendanceRegister } from "@/components/hr/attendance-register";

export default function HRAttendancePage() {
  return (
    <RoleGuard allow={["admin", "hr", "branch_manager"]}>
      <AttendanceRegister />
    </RoleGuard>
  );
}
