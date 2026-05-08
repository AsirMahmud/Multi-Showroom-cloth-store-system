"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

import { branchesApi } from "@/lib/api/branches";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Role = "hr" | "branch_manager" | "admin";

export function AccountCreateForm() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("hr");
  const [managedBranch, setManagedBranch] = useState<string>("");
  const [info, setInfo] = useState<string>("");

  const { data: branches } = useQuery({
    queryKey: ["branches"],
    queryFn: branchesApi.getBranches,
  });

  const createAccount = useMutation({
    mutationFn: () =>
      branchesApi.createStaffAccount({
        username: username.trim(),
        email: email.trim(),
        password,
        role,
        managed_branch: role === "branch_manager" ? Number(managedBranch) : null,
        hr_branch_ids: role === "hr" ? (branches ?? []).map((b) => b.id) : [],
      }),
    onSuccess: (result) => {
      setInfo(`Created ${result.role} account: ${result.username}`);
      setUsername("");
      setEmail("");
      setPassword("");
      setManagedBranch("");
    },
    onError: () => {
      setInfo("Failed to create account. Check fields and permissions.");
    },
  });

  const canSubmit = useMemo(() => {
    if (!username.trim() || !password) return false;
    if (role === "branch_manager" && !managedBranch) return false;
    return true;
  }, [managedBranch, password, role, username]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create HR/Manager Account</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="acc-username">Username</Label>
          <Input
            id="acc-username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="new_user"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="acc-email">Email</Label>
          <Input
            id="acc-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@company.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="acc-password">Password</Label>
          <Input
            id="acc-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min 6 characters"
          />
        </div>
        <div className="space-y-2">
          <Label>Role</Label>
          <Select value={role} onValueChange={(v: Role) => setRole(v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hr">HR</SelectItem>
              <SelectItem value="branch_manager">Branch Manager</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {role === "branch_manager" && (
          <div className="space-y-2 md:col-span-2">
            <Label>Managed Branch</Label>
            <Select value={managedBranch} onValueChange={setManagedBranch}>
              <SelectTrigger>
                <SelectValue placeholder="Select branch" />
              </SelectTrigger>
              <SelectContent>
                {branches?.map((branch) => (
                  <SelectItem key={branch.id} value={String(branch.id)}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="md:col-span-2 flex items-center gap-3">
          <Button
            onClick={() => createAccount.mutate()}
            disabled={!canSubmit || createAccount.isPending}
          >
            {createAccount.isPending ? "Creating..." : "Create Account"}
          </Button>
          {info ? <span className="text-sm text-muted-foreground">{info}</span> : null}
        </div>
      </CardContent>
    </Card>
  );
}
