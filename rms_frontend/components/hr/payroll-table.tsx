"use client";

import { usePayroll, useRunPayroll } from "@/hooks/queries/use-hr";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function PayrollTable() {
  const { data } = usePayroll();
  const runPayroll = useRunPayroll();
  return (
    <div className="space-y-4">
      <Button onClick={() => runPayroll.mutate()} disabled={runPayroll.isPending}>
        Run Monthly Payroll
      </Button>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee</TableHead>
            <TableHead>Period</TableHead>
            <TableHead>Net Amount</TableHead>
            <TableHead>Paid</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data?.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{row.employee_name}</TableCell>
              <TableCell>{row.period_start}</TableCell>
              <TableCell>{row.net_amount}</TableCell>
              <TableCell>{row.is_paid ? "Yes" : "No"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
