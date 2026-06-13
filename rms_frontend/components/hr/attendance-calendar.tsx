"use client";

import { useAttendance } from "@/hooks/queries/use-hr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AttendanceCalendar() {
  const { data } = useAttendance();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Attendance Records</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {data?.slice(0, 20).map((row) => (
          <div key={row.id} className="flex justify-between border-b pb-1">
            <span>{row.employee_name}</span>
            <span>{row.date}</span>
            <span className="capitalize">{row.status}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
