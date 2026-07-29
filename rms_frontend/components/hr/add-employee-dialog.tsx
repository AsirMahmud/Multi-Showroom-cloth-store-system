"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";

import { hrApi } from "@/lib/api/hr";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { useBranch } from "@/contexts/branch-context";

const employeeSchema = z.object({
  full_name: z.string().min(2, "Full name is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional(),
  designation: z.string().min(2, "Designation is required"),
  base_salary: z.string().regex(/^\d+(\.\d{1,2})?$/, "Must be a valid amount"),
  hire_date: z.string().optional(),
});

type EmployeeFormValues = z.infer<typeof employeeSchema>;

export function AddEmployeeDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const qc = useQueryClient();
  const { selectedBranchId } = useBranch();

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      full_name: "",
      email: "",
      phone: "",
      designation: "",
      base_salary: "0.00",
      hire_date: new Date().toISOString().split("T")[0],
    },
  });

  const mutation = useMutation({
    mutationFn: (data: EmployeeFormValues) => {
      // The backend uses the X-Branch-Id header from axios-config, so we don't strictly need to pass branch if the API is branch-scoped. 
      // But we can pass it if required. Usually it's handled by the header.
      return hrApi.createEmployee(data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hr", "employees"] });
      toast({
        title: "Employee Added",
        description: "The new employee has been added to this branch.",
      });
      form.reset();
      setOpen(false);
    },    onError: (e: any) => {
      toast({
        title: "Failed to add employee",
        description: e.response?.data?.detail || "An error occurred.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EmployeeFormValues) => {
    if (!selectedBranchId) {
      toast({
        title: "No Branch Selected",
        description: "Please select a branch first.",
        variant: "destructive",
      });
      return;
    }
    mutation.mutate({ ...data, branch: selectedBranchId });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#163625] hover:bg-[#1a402d] text-white">
          <Plus className="mr-2 h-4 w-4" />
          Add Employee
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-[#163625]">Add New Employee</DialogTitle>
          <DialogDescription>
            Register a new employee for the current branch.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="john@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="+880..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="designation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Designation</FormLabel>
                    <FormControl>
                      <Input placeholder="Sales Associate" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="base_salary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Base Salary</FormLabel>
                    <FormControl>
                      <Input placeholder="15000.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="hire_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hire Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full bg-[#163625] hover:bg-[#1a402d]"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Adding..." : "Add Employee"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
