"use client";
import type React from "react";
import { Inter } from "next/font/google";
import "../globals.css";
import { SideNav } from "@/components/side-nav";
import { UpperNav } from "@/components/upper-nav";
import { ThemeProvider } from "@/components/theme-provider";
import { TaskProvider } from "@/context/task-context";
import { AuthProvider } from "@/contexts/auth-context";
import { BranchProvider } from "@/contexts/branch-context";
import { BismillahProvider } from "@/contexts/bismillah-context";
import { BismillahLogo } from "@/components/bismillah-logo";
import { BranchSelectorModal } from "@/components/branch/branch-selector-modal";
import { ViewingBranchRibbon } from "@/components/branch/viewing-branch-ribbon";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

const inter = Inter({ subsets: ["latin"] });

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthProvider>
      <BranchProvider>
        <TaskProvider>
          <ThemeProvider attribute="class" defaultTheme="light">
            <BismillahProvider>
              <SidebarProvider>
                <MainShell>{children}</MainShell>
              </SidebarProvider>
              <BranchSelectorModal />
            </BismillahProvider>
          </ThemeProvider>
        </TaskProvider>
      </BranchProvider>
    </AuthProvider>
  );
}

function MainShell({ children }: { children: React.ReactNode }) {
  const sidebarOffset = "md:ml-[280px]";

  return (
    <div className="flex min-h-screen w-full selection:bg-brand-secondary selection:text-brand-primary">
      <SideNav />
      <SidebarInset className={`flex flex-col min-w-0 flex-1 transition-[margin] duration-300 ease-in-out ${sidebarOffset}`}>
        <UpperNav />
        <div className="flex-1 flex flex-col relative">
          <ViewingBranchRibbon />
          <BismillahLogo />
          <main className="flex-1 p-4 md:p-8 transition-all duration-500 ease-in-out">
            {children}
          </main>
        </div>
      </SidebarInset>
    </div>
  );
}
