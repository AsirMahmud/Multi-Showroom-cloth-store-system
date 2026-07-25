"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart,
  Calendar,
  DollarSign,
  Home,
  Menu,
  Package,
  Settings,
  ShoppingBag,
  Store,
  Users,
  LineChart,
  CheckSquare,
  LogOut,
  ChartBarBigIcon,
  Clock,
  Globe,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/auth-context";
import { homePageSettingsApi, HomePageSettings } from "@/lib/api/ecommerce";
import { useEffect } from "react";
import { BrandLogos } from "./brand-logos";
import type { PermissionCode, UserRole } from "@/types/auth";
import { useBranch } from "@/contexts/branch-context";

type NavItem = {
  title: string;
  icon: any;
  href: string;
  /** If set, item is shown only when user has at least one of these roles. */
  roles?: UserRole[];
  /** If set, item is shown only when user has at least one of these permissions. */
  anyPermission?: PermissionCode[];
  subItems?: NavItem[];
};

const mainNavItems: NavItem[] = [
  {
    title: "Dashboard",
    icon: Home,
    href: "/",
  },
  {
    title: "POS",
    icon: ShoppingBag,
    href: "/pos",
    anyPermission: ["create_sale"],
  },
  {
    title: "Sales",
    icon: LineChart,
    href: "/sales",
    anyPermission: ["view_sales"],
    subItems: [
      { title: "Overview", icon: LineChart, href: "/sales" },
      { title: "Sales History", icon: LineChart, href: "/sales/sales-history" },
      { title: "Due", icon: LineChart, href: "/sales/due", anyPermission: ["manage_due_payments"] },
      { title: "Returns", icon: LineChart, href: "/sales/returns" },
    ],
  },
  {
    title: "Customers",
    icon: Users,
    href: "/customers",
    anyPermission: ["view_customers", "manage_customers"],
  },
  {
    title: "Inventory",
    icon: Package,
    href: "/inventory",
    anyPermission: ["view_inventory"],
    subItems: [
      { title: "Dashboard", icon: Package, href: "/inventory" },
      { title: "Products", icon: Package, href: "/inventory/products" },
      { title: "Add Product", icon: Package, href: "/inventory/add-product", anyPermission: ["manage_product_catalog"] },
      { title: "Categories", icon: Package, href: "/inventory/categories", anyPermission: ["manage_categories"] },
      { title: "Online Categories", icon: Package, href: "/inventory/online-category", anyPermission: ["manage_online_categories"] },
      { title: "Suppliers", icon: Package, href: "/inventory/suppliers", anyPermission: ["manage_suppliers"] },
    ],
  },
  {
    title: "Preorders",
    icon: Clock,
    href: "/preorder",
    anyPermission: ["view_preorders", "manage_preorders"],
    subItems: [
      { title: "Dashboard", icon: Clock, href: "/preorder" },
      { title: "Create Preorder", icon: Clock, href: "/preorder/create", anyPermission: ["manage_preorders"] },
      { title: "Add Product", icon: Clock, href: "/preorder?tab=add-product", anyPermission: ["manage_preorders"] },
      { title: "Online Preorders", icon: Clock, href: "/online-preorders", anyPermission: ["manage_online_preorders"] },
    ],
  },
  {
    title: "Expenses",
    icon: DollarSign,
    href: "/expenses",
    anyPermission: ["view_expenses", "create_expense"],
  },
  {
    title: "Reports",
    icon: ChartBarBigIcon,
    href: "/reports",
    anyPermission: ["view_reports"],
  },
  {
    title: "Admin",
    icon: Store,
    href: "/admin",
    roles: ["admin"],
    subItems: [
      { title: "Control Panel", icon: Store, href: "/admin" },
      { title: "Branches", icon: Store, href: "/admin/branches" },
      { title: "Account Center", icon: Store, href: "/admin/accounts" },
      { title: "Roles & Permissions", icon: Store, href: "/admin/roles" },
      { title: "Audit Log", icon: Store, href: "/admin/audit-log" },
    ],
  },
  {
    title: "HR",
    icon: Calendar,
    href: "/hr",
    roles: ["admin", "hr", "branch_manager"],
    anyPermission: ["view_employees"],
    subItems: [
      { title: "Overview", icon: Calendar, href: "/hr" },
      { title: "Employees", icon: Calendar, href: "/hr/employees" },
      { title: "Attendance", icon: Calendar, href: "/hr/attendance", anyPermission: ["manage_attendance"] },
      { title: "Payroll", icon: Calendar, href: "/hr/payroll", anyPermission: ["manage_payroll"] },
    ],
  },
  {
    title: "Ecommerce Settings",
    icon: Globe,
    href: "/ecommerce-settings",
    anyPermission: [
      "manage_home_page_settings",
      "manage_hero_slides",
      "manage_discounts",
      "manage_product_status",
      "manage_promotional_modals",
    ],
    subItems: [
      { title: "Home Page Settings", icon: Globe, href: "/ecommerce-settings/home-page", anyPermission: ["manage_home_page_settings"] },
      { title: "Hero Settings", icon: Globe, href: "/ecommerce-settings/hero-slides", anyPermission: ["manage_hero_slides"] },
      { title: "Discount Management", icon: Globe, href: "/ecommerce-settings/discounts", anyPermission: ["manage_discounts"] },
      { title: "Product Status", icon: Globe, href: "/ecommerce-settings/product-status", anyPermission: ["manage_product_status"] },
      { title: "Delivery Charges", icon: Globe, href: "/ecommerce-settings/delivery-charges", anyPermission: ["manage_settings"] },
      { title: "Promotional Modals", icon: Globe, href: "/ecommerce-settings/promotional-modals", anyPermission: ["manage_promotional_modals"] },
      { title: "Open Ecommerce Site", icon: Globe, href: "#" },
    ],
  },
];

const utilityNavItems: {
  title: string;
  icon: any;
  href: string;
}[] = [
    {
      title: "Settings",
      icon: Settings,
      href: "/settings",
    },
  ];

export function SideNav() {
  const [open, setOpen] = useState(false);
  const [openCollapsibles, setOpenCollapsibles] = useState<
    Record<string, boolean>
  >({});
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user } = useAuth();
  const { selectedBranchId, availableBranches, openBranchSelector } = useBranch();
  const [branding, setBranding] = useState<HomePageSettings | null>(null);
  const isCollapsed = false;

  const currentBranch = availableBranches.find(b => b.id === selectedBranchId);

  useEffect(() => {
    const fetchBranding = async () => {
      try {
        const data = await homePageSettingsApi.get();
        setBranding(data);
      } catch (error) {
        console.error("Failed to fetch branding:", error);
      }
    };
    fetchBranding();
  }, []);

  const toggleCollapsible = (title: string) => {
    setOpenCollapsibles((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const isSubItemActive = (href: string) => {
    return pathname === href;
  };

  const handleLogout = () => {
    // Add your logout logic here
    logout();
  };

  const role = user?.role as UserRole | undefined;
  const userPerms = new Set(user?.permissions ?? []);
  const isAdmin = role === "admin";

  const itemAllowed = (item: NavItem): boolean => {
    if (item.roles && (!role || !item.roles.includes(role))) return false;
    if (item.anyPermission && !isAdmin) {
      return item.anyPermission.some((code) => userPerms.has(code));
    }
    return true;
  };

  const filterSubItems = (subs?: NavItem[]) =>
    (subs ?? []).filter(itemAllowed);

  // Hide a parent if it has subItems and none of them are allowed.
  const visibleMainNavItems = mainNavItems
    .filter(itemAllowed)
    .map((item) => {
      if (!item.subItems) return item;
      const allowedSubs = filterSubItems(item.subItems);
      return { ...item, subItems: allowedSubs };
    })
    .filter((item) => !item.subItems || item.subItems.length > 0);

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          asChild
          className="md:hidden absolute h-screen top-4 left-4 z-50"
        >
          <Button
            variant="outline"
            size="icon"
            className="bg-white/80 backdrop-blur-sm hover:bg-white"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="p-0 w-[280px] border-r border-brand-primary/5 bg-white text-slate-600"
        >
          <div className="flex flex-col h-full bg-white/95 backdrop-blur-xl border-r border-brand-primary/5 shadow-2xl">
            <div className="p-8 pb-4">
              <Link href="/" className="flex items-center gap-3 group" onClick={() => setOpen(false)}>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-primary text-brand-secondary shadow-lg shadow-brand-primary/20 transition-transform group-hover:scale-105">
                  <Store className="h-6 w-6" />
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-black tracking-tight text-brand-primary">
                    RMS Admin
                  </span>
                  <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">
                    Professional
                  </span>
                </div>
              </Link>
            </div>

            {/* Branch Status Selector (Mobile) */}
            <div className="px-4 py-3">
              <button
                onClick={() => {
                  setOpen(false);
                  openBranchSelector();
                }}
                className="w-full text-left bg-slate-50/50 backdrop-blur-sm border border-brand-primary/5 rounded-[24px] p-5 hover:bg-white hover:shadow-premium transition-all group"
              >
                <div className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1">
                  Active Workspace
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Store className="h-4 w-4 text-brand-primary" />
                    <span className="text-xs font-bold text-slate-700 truncate">
                      {selectedBranchId === null ? "Global Dashboard" : currentBranch?.name || "Select Branch"}
                    </span>
                  </div>
                  <Settings className="h-4 w-4 text-slate-300 group-hover:text-brand-primary transition-colors" />
                </div>
              </button>
            </div>

                <ScrollArea className="flex-1 px-4">
                  <nav className="grid gap-1.5">
                    {visibleMainNavItems.map((item) =>
                      item.subItems ? (
                        <Collapsible
                          key={item.title}
                          open={openCollapsibles[item.title] || isActive(item.href)}
                          onOpenChange={() => toggleCollapsible(item.title)}
                        >
                          <CollapsibleTrigger asChild>
                            <button
                              className={cn(
                                "flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-all duration-300",
                                isActive(item.href)
                                  ? "bg-brand-secondary/50 text-brand-primary shadow-sm"
                                  : "text-slate-500 hover:bg-slate-50 hover:text-brand-primary"
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <item.icon
                                  className={cn(
                                    "h-5 w-5 transition-colors",
                                    isActive(item.href) ? "text-brand-primary" : "text-slate-400"
                                  )}
                                />
                                {item.title}
                              </div>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className={cn(
                                  "transition-transform duration-300",
                                  openCollapsibles[item.title] || isActive(item.href)
                                    ? "rotate-180"
                                    : ""
                                )}
                              >
                                <polyline points="6 9 12 15 18 9" />
                              </svg>
                            </button>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="ml-9 mt-1 space-y-1 border-l-2 border-brand-primary/5 pl-4">
                              {item.subItems.map((subItem) => {
                                const isExternal = subItem.href.startsWith("http")
                                  const commonClass = cn(
                                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200",
                                    isSubItemActive(subItem.href)
                                      ? "text-brand-primary bg-brand-secondary/30"
                                      : "text-slate-400 hover:text-brand-primary hover:bg-slate-50"
                                  )
                                return isExternal ? (
                                  <a
                                    key={subItem.title}
                                    href={subItem.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={commonClass}
                                    onClick={() => setOpen(false)}
                                  >
                                    {subItem.title}
                                  </a>
                                ) : (
                                  <Link
                                    key={subItem.title}
                                    href={subItem.href}
                                    onClick={() => setOpen(false)}
                                    className={commonClass}
                                  >
                                    {subItem.title}
                                  </Link>
                                )
                              })}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      ) : (
                        <Link
                          key={item.title}
                          href={item.href}
                          onClick={() => setOpen(false)}
                          className={cn(
                            "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-all duration-300",
                            isActive(item.href)
                              ? "bg-brand-secondary/80 text-brand-primary shadow-md shadow-brand-primary/5"
                              : "text-slate-500 hover:bg-slate-50 hover:text-brand-primary"
                          )}
                        >
                          <item.icon
                            className={cn(
                              "h-5 w-5 transition-colors",
                              isActive(item.href) ? "text-brand-primary" : "text-slate-400"
                            )}
                          />
                          {item.title}
                        </Link>
                      )
                    )}
                  </nav>
                  <Separator className="my-6 mx-4 bg-slate-100" />
                  <nav className="grid gap-1.5 px-0">
                    {utilityNavItems.map((item) => (
                      <Link
                        key={item.title}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-bold transition-all duration-300",
                          isActive(item.href)
                            ? "bg-brand-secondary/50 text-brand-primary shadow-sm"
                            : "text-slate-500 hover:bg-slate-50 hover:text-brand-primary"
                        )}
                      >
                        <item.icon
                          className={cn(
                            "h-5 w-5 transition-colors",
                            isActive(item.href) ? "text-brand-primary" : "text-slate-400"
                          )}
                        />
                        {item.title}
                      </Link>
                    ))}
                  </nav>
                </ScrollArea>

                <div className="p-6 bg-slate-50/50 border-t border-slate-100 m-4 rounded-3xl">
                  <div className="flex items-center gap-3 px-2 mb-4">
                    <div className="h-10 w-10 rounded-2xl bg-brand-primary text-brand-secondary flex items-center justify-center font-black shadow-lg">
                      {user?.username?.slice(0, 2).toUpperCase() || "U"}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-bold text-slate-900 truncate">
                        {user?.username || "User"}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest truncate">
                        {user?.role?.replace("_", " ") || "Member"}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={handleLogout}
                    className="w-full h-11 text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-all rounded-2xl flex items-center justify-center gap-2 border border-slate-100 font-bold"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </Button>
                </div>
              </div>
        </SheetContent>
      </Sheet>

      <div
        className={cn(
          "z-30 hidden md:flex flex-col h-screen fixed left-0 top-0 border-r border-brand-primary/5 bg-white/80 backdrop-blur-xl text-slate-600 shadow-xl transition-[width] duration-300 ease-in-out",
          isCollapsed ? "w-[72px]" : "w-[280px]"
        )}
      >
        <div className={cn("p-8 transition-all duration-300", isCollapsed && "px-3 py-5")}>
          <Link href="/" className={cn("flex items-center gap-4 group", isCollapsed && "justify-end")}>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-primary text-brand-secondary shadow-lg shadow-brand-primary/20 transition-all duration-500 group-hover:rotate-12 group-hover:scale-110 flex-shrink-0">
              {branding?.logo_image_url ? (
                <img src={branding.logo_image_url} alt="Logo" className="h-7 w-7 object-contain" />
              ) : (
                <Store className="h-7 w-7" />
              )}
            </div>
            <div className={cn("flex flex-col min-w-0", isCollapsed && "hidden")}>
              <span className="text-xl font-black tracking-tight text-brand-primary group-hover:text-emerald-700 transition-colors uppercase truncate">
                {branding?.logo_text || "RMS Admin"}
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">
                {branding?.logo_text ? "Management" : "Professional Suite"}
              </span>
            </div>
          </Link>
        </div>

        <ScrollArea className={cn("flex-1 transition-all duration-300", isCollapsed ? "px-2" : "px-4")}>
          <nav className="grid gap-1.5 mb-6">
            {visibleMainNavItems.map((item) =>
              item.subItems ? (
                <Collapsible
                  key={item.title}
                  open={openCollapsibles[item.title] || isActive(item.href)}
                  onOpenChange={() => toggleCollapsible(item.title)}
                >
                  <CollapsibleTrigger asChild>
                    <button
                      className={cn(
                        "flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-all duration-300",
                        isCollapsed && "h-12 justify-end px-2.5",
                        isActive(item.href)
                          ? "bg-brand-secondary/80 text-brand-primary shadow-md shadow-brand-primary/5"
                          : "text-slate-500 hover:bg-slate-50 hover:text-brand-primary"
                      )}
                      title={isCollapsed ? item.title : undefined}
                    >
                      <div className={cn("flex items-center gap-3", isCollapsed && "justify-end")}>
                        <item.icon
                          className={cn(
                            "h-5 w-5 transition-colors",
                            isCollapsed && "h-7 w-7",
                            isActive(item.href) ? "text-brand-primary" : "text-slate-400"
                          )}
                        />
                        {!isCollapsed && item.title}
                      </div>
                      {!isCollapsed && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className={cn(
                            "transition-transform duration-300",
                            openCollapsibles[item.title] || isActive(item.href)
                              ? "rotate-180"
                              : ""
                          )}
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      )}
                    </button>
                  </CollapsibleTrigger>
                  {!isCollapsed && <CollapsibleContent>
                    <div className="ml-9 mt-1 space-y-1 border-l-2 border-brand-primary/5 pl-4">
                      {item.subItems.map((subItem) => {
                        const isExternal = subItem.href.startsWith("http")
                          const commonClass = cn(
                            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200",
                            isSubItemActive(subItem.href)
                              ? "text-brand-primary bg-brand-secondary/30"
                              : "text-slate-400 hover:text-brand-primary hover:bg-slate-50"
                          )
                        return isExternal ? (
                          <a
                            key={subItem.title}
                            href={subItem.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={commonClass}
                          >
                            {subItem.title}
                          </a>
                        ) : (
                          <Link
                            key={subItem.title}
                            href={subItem.href}
                            className={commonClass}
                          >
                            {subItem.title}
                          </Link>
                        )
                      })}
                    </div>
                  </CollapsibleContent>}
                </Collapsible>
              ) : (
                <Link
                  key={item.title}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-all duration-300",
                    isCollapsed && "h-12 justify-end px-2.5",
                    isActive(item.href)
                      ? "bg-brand-secondary/80 text-brand-primary shadow-md shadow-brand-primary/5"
                      : "text-slate-500 hover:bg-slate-50 hover:text-brand-primary"
                  )}
                  title={isCollapsed ? item.title : undefined}
                >
                  <item.icon
                    className={cn(
                      "h-5 w-5 transition-colors",
                      isCollapsed && "h-7 w-7",
                      isActive(item.href) ? "text-brand-primary" : "text-slate-400"
                    )}
                  />
                  {!isCollapsed && item.title}
                </Link>
              )
            )}
          </nav>
          <Separator className={cn("my-6 bg-slate-100", isCollapsed ? "mx-2" : "mx-4")} />
          <nav className="grid gap-1.5 px-0">
            {utilityNavItems.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-bold transition-all duration-300",
                  isCollapsed && "h-12 justify-end px-2.5",
                  isActive(item.href)
                    ? "bg-brand-secondary/50 text-brand-primary shadow-sm"
                    : "text-slate-500 hover:bg-slate-50 hover:text-brand-primary"
                )}
                title={isCollapsed ? item.title : undefined}
              >
                <item.icon
                  className={cn(
                    "h-5 w-5 transition-colors",
                    isCollapsed && "h-7 w-7",
                    isActive(item.href) ? "text-brand-primary" : "text-slate-400"
                  )}
                />
                {!isCollapsed && item.title}
              </Link>
            ))}
          </nav>
        </ScrollArea>

        <div className={cn("bg-slate-50/50 backdrop-blur-md border-t border-slate-100 rounded-3xl shadow-premium transition-all duration-300", isCollapsed ? "mx-2 mb-4 p-2" : "mx-4 mb-6 p-6")}>
          <div className={cn("flex items-center gap-4 px-2", isCollapsed ? "justify-end mb-0 px-1" : "mb-5")}>
            <div className="h-12 w-12 rounded-2xl bg-brand-primary text-brand-secondary flex items-center justify-center font-black shadow-lg">
              {user?.username?.slice(0, 2).toUpperCase() || "U"}
            </div>
            <div className={cn("flex flex-col min-w-0", isCollapsed && "hidden")}>
              <span className="text-sm font-bold text-slate-900 truncate leading-none mb-1">
                {user?.username || "User"}
              </span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest truncate">
                {user?.role?.replace("_", " ") || "Member"}
              </span>
            </div>
          </div>
          {!isCollapsed && (
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full h-12 text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-all rounded-2xl flex items-center justify-center gap-3 border border-slate-100 font-bold"
            >
              <LogOut className="h-5 w-5" />
              Sign Out
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
