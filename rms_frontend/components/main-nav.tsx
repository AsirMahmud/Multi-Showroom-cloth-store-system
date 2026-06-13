"use client"

import React, { useState } from "react"
import { usePathname } from "next/navigation"
import { Bell, HelpCircle, Search, Moon, Sun, MessageSquare } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTheme } from "next-themes"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

export function MainNav() {
  const [notifications, setNotifications] = useState(4)
  const { setTheme, theme } = useTheme()
  const pathname = usePathname()

  // Generate breadcrumbs based on the current path
  const generateBreadcrumbs = () => {
    if (pathname === "/") {
      return [{ label: "Dashboard", href: "/" }]
    }

    const segments = pathname.split("/").filter(Boolean)

    return [
      { label: "Dashboard", href: "/" },
      ...segments.map((segment, index) => {
        const href = `/${segments.slice(0, index + 1).join("/")}`
        return {
          label: segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " "),
          href,
        }
      }),
    ]
  }

  const breadcrumbs = generateBreadcrumbs()

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-brand-primary/5 bg-white/60 backdrop-blur-xl px-4 sm:px-6">
      <div className="hidden md:block">
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={crumb.href}>
                <BreadcrumbItem>
                  <BreadcrumbLink
                    href={crumb.href}
                    className={cn(
                      "transition-colors hover:text-brand-primary",
                      index === breadcrumbs.length - 1 ? "font-bold text-brand-primary" : "text-slate-500"
                    )}
                  >
                    {crumb.label}
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <div className="hidden md:block w-full max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input type="search" placeholder="Search anything..." className="w-full bg-slate-100/50 border-transparent focus:bg-white focus:border-brand-primary/20 transition-all pl-9 md:w-[240px] lg:w-[340px] rounded-xl h-10" />
          </div>
        </div>

        <Button variant="ghost" size="icon" className="relative hover:bg-brand-secondary/30 text-slate-600 hover:text-brand-primary rounded-xl transition-all">
          <Bell className="h-5 w-5" />
          {notifications > 0 && (
            <Badge
              className="absolute top-1.5 right-1.5 h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-brand-primary text-brand-secondary border-0"
            >
              {notifications}
            </Badge>
          )}
        </Button>

        <Button variant="ghost" size="icon" className="hover:bg-brand-secondary/30 text-slate-600 hover:text-brand-primary rounded-xl transition-all">
          <MessageSquare className="h-5 w-5" />
        </Button>

        <Button variant="ghost" size="icon" className="hover:bg-brand-secondary/30 text-slate-600 hover:text-brand-primary rounded-xl transition-all" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>

        <Button variant="ghost" size="icon" className="hover:bg-brand-secondary/30 text-slate-600 hover:text-brand-primary rounded-xl transition-all">
          <HelpCircle className="h-5 w-5" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-xl hover:bg-brand-secondary/30 p-0 overflow-hidden border border-brand-primary/5">
              <Avatar className="h-10 w-10 rounded-none">
                <AvatarFallback className="bg-brand-secondary text-brand-primary font-bold">JD</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuItem>Notifications</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600">Log out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
