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
      { title: "Financial Overview", icon: Store, href: "/admin/financial-overview" },
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
      { title: "Open Ecommerce Site", icon: Globe, href: "https:/rawstitch.com.bd" },
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
          className="bg-[#163625] p-0 w-[280px] border-r border-[#E4FCD5]/10 text-white"
        >
          <div className="flex flex-col h-full">
            <div className="flex flex-col h-auto items-center px-6 border-b border-[#E4FCD5]/10 bg-[#163625]">
              {branding?.logo_image_url ? (
                <img
                  src={branding.logo_image_url}
                  alt={branding.logo_text || "Logo"}
                  className="w-full h-24 object-contain my-4"
                />
              ) : (
                <div className="py-8">
                  <span className="text-xl font-bold text-blue-900">
                    {branding?.logo_text || "RAW STITCH"}
                  </span>
                </div>
              )}
            </div>
            {/* New Feature: Branch Status */}
            <div className="px-4 py-3">
              <button
                onClick={() => {
                  setOpen(false);
                  openBranchSelector();
                }}
                className="w-full text-left bg-white/5 border border-white/10 rounded-2xl p-3 hover:bg-white/10 transition-all group"
              >
                <div className="text-[10px] uppercase tracking-widest text-emerald-200/40 font-bold mb-1">
                  Active Workspace
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Store className="h-4 w-4 text-[#E4FCD5]" />
                    <span className="text-sm font-semibold text-white truncate">
                      {selectedBranchId === null ? "Global Dashboard" : currentBranch?.name || "Select Branch"}
                    </span>
                  </div>
                  <div className="h-5 w-5 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-[#E4FCD5] group-hover:text-[#163625] transition-colors">
                    <Clock className="h-3 w-3" />
                  </div>
                </div>
              </button>
            </div>
            <ScrollArea className="flex-1">
              <nav className="grid gap-1 p-4">
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
                            "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300",
                            isActive(item.href)
                              ? "bg-[#E4FCD5] text-[#163625] shadow-lg shadow-[#E4FCD5]/10"
                              : "text-emerald-50/60 hover:bg-white/5 hover:text-emerald-50"
                          )}
                          onClick={() => setOpen(false)}
                        >
                          <div className="flex items-center gap-3">
                            <item.icon
                              className={cn(
                                "h-5 w-5 transition-colors",
                                isActive(item.href)
                                  ? "text-[#163625]"
                                  : "text-emerald-200/40"
                              )}
                            />
                            {item.title}
                          </div>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className={cn(
                              "h-4 w-4 transition-transform duration-200",
                              openCollapsibles[item.title] ||
                                isActive(item.href)
                                ? "rotate-180"
                                : ""
                            )}
                          >
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="ml-8 mt-1 space-y-1">
                          {item.subItems.map((subItem) => {
                            const isExternal = subItem.href.startsWith("http")
                              const commonClass = cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                                isSubItemActive(subItem.href)
                                  ? "text-[#E4FCD5] bg-white/5"
                                  : "text-emerald-50/40 hover:text-emerald-50 hover:bg-white/5"
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
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                        isActive(item.href)
                          ? "bg-blue-100 text-blue-900 shadow-sm"
                          : "text-gray-600 hover:bg-blue-50 hover:text-blue-900"
                      )}
                    >
                      <item.icon
                        className={cn(
                          "h-5 w-5 transition-colors",
                          isActive(item.href)
                          ? "text-[#163625]"
                          : "text-emerald-200/40"
                        )}
                      />
                      {item.title}
                    </Link>
                  )
                )}
              </nav>
              <Separator className="my-2 mx-4 bg-blue-100" />
              <nav className="grid gap-1 p-4">
                {utilityNavItems.map((item) => (
                  <Link
                    key={item.title}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300",
                      isActive(item.href)
                        ? "bg-[#E4FCD5] text-[#163625] shadow-lg shadow-[#E4FCD5]/10"
                        : "text-emerald-50/60 hover:bg-white/5 hover:text-emerald-50"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "h-5 w-5 transition-colors",
                        isActive(item.href) ? "text-blue-600" : "text-gray-500"
                      )}
                    />
                    {item.title}
                  </Link>
                ))}
              </nav>
              <div className="px-4 py-4 mt-auto">
                <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-3 px-2">
                  Our Brands
                </p>
                <BrandLogos className="justify-start gap-4 px-2" itemClassName="grayscale-[0.5] opacity-70 hover:opacity-100" />
              </div>
            </ScrollArea>
            <div className="p-4 bg-white/5 border-t border-[#E4FCD5]/10">
              <div className="flex items-center gap-3 px-2 mb-4">
                <div className="h-10 w-10 rounded-full bg-[#E4FCD5] flex items-center justify-center text-[#163625] font-bold">
                  {user?.username?.slice(0, 2).toUpperCase() || "U"}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-semibold text-white truncate">
                    {user?.username || "User"}
                  </span>
                  <span className="text-[10px] text-emerald-200/40 uppercase tracking-wider font-medium truncate">
                    {user?.role?.replace("_", " ") || "Member"}
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="w-full h-11 text-emerald-50/60 hover:text-rose-400 hover:bg-rose-500/10 transition-all rounded-xl flex items-center justify-center gap-2 border border-white/5"
              >
                <LogOut className="h-4 w-4" />
                Logout Session
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <div className="hidden md:flex flex-col w-[280px] h-screen fixed border-r border-[#E4FCD5]/10 bg-[#163625] text-white">
        <div className="flex h-auto items-center px-6 border-b border-[#E4FCD5]/10 bg-[#163625]">
          <div className="flex flex-col h-auto mx-auto py-4 overflow-hidden items-center">
            {branding?.logo_image_url ? (
              <img
                src={branding.logo_image_url}
                alt={branding.logo_text || "Logo"}
                className="w-full h-24 object-contain"
              />
            ) : (
              <span className="text-xl font-bold text-[#E4FCD5]">
                {branding?.logo_text || "RAW STITCH"}
              </span>
            )}
          </div>
        </div>
        {/* New Feature: Branch Status (Desktop) */}
        <div className="px-4 py-3">
          <button
            onClick={openBranchSelector}
            className="w-full text-left bg-white/5 border border-white/10 rounded-2xl p-3 hover:bg-white/10 transition-all group"
          >
            <div className="text-[10px] uppercase tracking-widest text-emerald-200/40 font-bold mb-1">
              Active Workspace
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Store className="h-4 w-4 text-[#E4FCD5]" />
                <span className="text-sm font-semibold text-white truncate">
                  {selectedBranchId === null ? "Global Dashboard" : currentBranch?.name || "Select Branch"}
                </span>
              </div>
              <div className="h-5 w-5 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-[#E4FCD5] group-hover:text-[#163625] transition-colors">
                <Settings className="h-3 w-3" />
              </div>
            </div>
          </button>
        </div>
        <ScrollArea className="flex-1">
          <nav className="grid gap-1 p-4">
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
                        "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300",
                        isActive(item.href)
                          ? "bg-[#E4FCD5] text-[#163625] shadow-lg shadow-[#E4FCD5]/10"
                          : "text-emerald-50/60 hover:bg-white/5 hover:text-emerald-50"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon
                          className={cn(
                            "h-5 w-5 transition-colors",
                            isActive(item.href)
                              ? "text-blue-600"
                              : "text-gray-500"
                          )}
                        />
                        {item.title}
                      </div>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={cn(
                          "h-4 w-4 transition-transform duration-200",
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
                    <div className="ml-8 mt-1 space-y-1">
                      {item.subItems.map((subItem) => {
                        const isExternal = subItem.href.startsWith("http")
                          const commonClass = cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                            isSubItemActive(subItem.href)
                              ? "text-[#E4FCD5] bg-white/5"
                              : "text-emerald-50/40 hover:text-emerald-50 hover:bg-white/5"
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
                  </CollapsibleContent>
                </Collapsible>
              ) : (
                <Link
                  key={item.title}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    isActive(item.href)
                      ? "bg-blue-100 text-blue-900 shadow-sm"
                      : "text-gray-600 hover:bg-blue-50 hover:text-blue-900"
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-5 w-5 transition-colors",
                      isActive(item.href) ? "text-blue-600" : "text-gray-500"
                    )}
                  />
                  {item.title}
                </Link>
              )
            )}
          </nav>
          <Separator className="my-2 mx-4 bg-blue-100" />
          <nav className="grid gap-1 p-4">
            {utilityNavItems.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300",
                  isActive(item.href)
                    ? "bg-[#E4FCD5] text-[#163625] shadow-lg shadow-[#E4FCD5]/10"
                    : "text-emerald-50/60 hover:bg-white/5 hover:text-emerald-50"
                )}
              >
                <item.icon
                  className={cn(
                    "h-5 w-5 transition-colors",
                    isActive(item.href) ? "text-blue-600" : "text-gray-500"
                  )}
                />
                {item.title}
              </Link>
            ))}
          </nav>
          <div className="px-4 py-4 mt-auto">
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-3 px-2">
              Our Brands
            </p>
            <BrandLogos className="justify-start gap-4 px-2" itemClassName="grayscale-[0.5] opacity-70 hover:opacity-100" />
          </div>
        </ScrollArea>
        <div className="p-4 bg-white/5 border-t border-[#E4FCD5]/10">
          <div className="flex items-center gap-3 px-2 mb-4">
            <div className="h-10 w-10 rounded-full bg-[#E4FCD5] flex items-center justify-center text-[#163625] font-bold">
              {user?.username?.slice(0, 2).toUpperCase() || "U"}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-white truncate">
                {user?.username || "User"}
              </span>
              <span className="text-[10px] text-emerald-200/40 uppercase tracking-wider font-medium truncate">
                {user?.role?.replace("_", " ") || "Member"}
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full h-11 text-emerald-50/60 hover:text-rose-400 hover:bg-rose-500/10 transition-all rounded-xl flex items-center justify-center gap-2 border border-white/5"
          >
            <LogOut className="h-4 w-4" />
            Logout Session
          </Button>
        </div>
      </div>
    </>
  );
}
