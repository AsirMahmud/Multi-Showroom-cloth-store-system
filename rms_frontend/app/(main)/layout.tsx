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
import { Toaster } from "@/components/ui/toaster";
import { BismillahLogo } from "@/components/bismillah-logo";
import { BranchSelectorModal } from "@/components/branch/branch-selector-modal";
import { ViewingBranchRibbon } from "@/components/branch/viewing-branch-ribbon";

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
              <div className="flex min-h-screen selection:bg-brand-secondary selection:text-brand-primary">
                <SideNav />
                <div className="flex-1 flex flex-col min-w-0 md:ml-[280px]">
                  <UpperNav />
                  <div className="flex-1 flex flex-col relative">
                    <ViewingBranchRibbon />
                    <BismillahLogo />
                    <main className="flex-1 p-4 md:p-8 transition-all duration-500 ease-in-out">
                      {children}
                    </main>
                  </div>
                  <Toaster />
                </div>
              </div>
              <BranchSelectorModal />
            </BismillahProvider>
          </ThemeProvider>
        </TaskProvider>
      </BranchProvider>
    </AuthProvider>
  );
}
