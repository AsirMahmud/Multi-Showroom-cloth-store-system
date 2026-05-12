"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { branchesApi } from "@/lib/api/branches";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlus, Shield, AtSign, KeyRound, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const accountSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["admin", "branch_manager", "hr"]),
  managed_branch: z.string().optional(),
}).refine((data) => {
  if (data.role === "branch_manager" && !data.managed_branch) {
    return false;
  }
  return true;
}, {
  message: "Branch assignment is required for managers",
  path: ["managed_branch"],
});

type AccountFormValues = z.infer<typeof accountSchema>;

export function AccountCreateForm() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      role: "hr",
      managed_branch: "",
    },
  });

  const selectedRole = watch("role");
  const selectedBranch = watch("managed_branch");

  const { data: branches } = useQuery({
    queryKey: ["branches"],
    queryFn: branchesApi.getBranches,
  });

  const createAccount = useMutation({
    mutationFn: (values: AccountFormValues) =>
      branchesApi.createStaffAccount({
        username: values.username.trim(),
        email: values.email?.trim() || undefined,
        password: values.password,
        role: values.role,
        managed_branch: values.role === "branch_manager" ? Number(values.managed_branch) : null,
        hr_branch_ids: values.role === "hr" ? (branches ?? []).map((b) => b.id) : [],
      }),
    onSuccess: (result) => {
      toast({
        title: "Identity Initialized",
        description: `Successfully provisioned ${result.role} credentials for ${result.username}`,
      });
      reset();
      qc.invalidateQueries({ queryKey: ["admin-accounts"] });
    },
    onError: (e: any) => {
      const errorData = e.response?.data;
      let errorMessage = "Integrity fault: Unable to initialize identity.";
      
      if (errorData) {
        if (typeof errorData === 'object') {
          errorMessage = Object.entries(errorData)
            .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : value}`)
            .join(" | ");
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        }
      }

      toast({
        title: "Provisioning Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AccountFormValues) => {
    createAccount.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 md:grid-cols-2">
      <div className="space-y-1.5">
        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Unique Username</Label>
        <div className="relative">
          <UserPlus className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            {...register("username")}
            placeholder="operator_01"
            className={cn(
              "pl-10 h-11 bg-slate-50 border-none rounded-xl font-bold text-sm",
              errors.username && "ring-1 ring-rose-500"
            )}
          />
        </div>
        {errors.username && (
          <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest ml-1">{errors.username.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Secure Email</Label>
        <div className="relative">
          <AtSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            {...register("email")}
            type="email"
            placeholder="staff@example.com"
            className={cn(
              "pl-10 h-11 bg-slate-50 border-none rounded-xl font-bold text-sm",
              errors.email && "ring-1 ring-rose-500"
            )}
          />
        </div>
        {errors.email && (
          <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest ml-1">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Security Credential</Label>
        <div className="relative">
          <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            {...register("password")}
            type="password"
            placeholder="Min 6 characters"
            className={cn(
              "pl-10 h-11 bg-slate-50 border-none rounded-xl font-bold text-sm",
              errors.password && "ring-1 ring-rose-500"
            )}
          />
        </div>
        {errors.password && (
          <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest ml-1">{errors.password.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Access Hierarchy</Label>
        <Select 
          value={selectedRole} 
          onValueChange={(v: "admin" | "branch_manager" | "hr") => setValue("role", v, { shouldValidate: true })}
        >
          <SelectTrigger className={cn(
            "h-11 bg-slate-50 border-none rounded-xl font-bold text-sm text-brand-primary",
            errors.role && "ring-1 ring-rose-500"
          )}>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-slate-400" />
              <SelectValue placeholder="Select role" />
            </div>
          </SelectTrigger>
          <SelectContent className="rounded-xl border-brand-primary/5">
            <SelectItem value="hr">Human Resources</SelectItem>
            <SelectItem value="branch_manager">Branch Manager</SelectItem>
            <SelectItem value="admin">Administrator</SelectItem>
          </SelectContent>
        </Select>
        {errors.role && (
          <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest ml-1">{errors.role.message}</p>
        )}
      </div>

      {selectedRole === "branch_manager" && (
        <div className="space-y-1.5 md:col-span-2">
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Node Assignment (Managed Branch)</Label>
          <Select 
            value={selectedBranch} 
            onValueChange={(v) => setValue("managed_branch", v, { shouldValidate: true })}
          >
            <SelectTrigger className={cn(
              "h-11 bg-slate-50 border-none rounded-xl font-bold text-sm text-brand-primary",
              errors.managed_branch && "ring-1 ring-rose-500"
            )}>
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-slate-400" />
                <SelectValue placeholder="Select branch" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl border-brand-primary/5">
              {branches?.map((branch) => (
                <SelectItem key={branch.id} value={String(branch.id)}>
                  {branch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.managed_branch && (
            <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest ml-1">{errors.managed_branch.message}</p>
          )}
        </div>
      )}

      <div className="md:col-span-2 flex flex-col sm:flex-row items-center gap-4 pt-2">
        <Button
          type="submit"
          disabled={createAccount.isPending}
          className="w-full sm:w-auto h-12 px-8 rounded-xl font-bold bg-brand-primary text-brand-secondary hover:bg-emerald-900 shadow-lg shadow-brand-primary/20 transition-all active:scale-95"
        >
          {createAccount.isPending ? "Hashing & Provisioning..." : "Initialize Identity"}
        </Button>
      </div>
    </form>
  );
}
