"use client";

import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Bell,
  Package,
  DollarSign,
  ShoppingBag,
  TrendingUp,
  ArrowRightLeft,
  Info,
  CheckCheck,
} from "lucide-react";
import {
  useNotifications,
  useUnreadCount,
  useMarkRead,
  useMarkAllRead,
} from "@/hooks/queries/use-notifications";
import type { Notification } from "@/lib/api/notifications";

const kindIconMap: Record<string, { icon: typeof Bell; color: string }> = {
  LOW_STOCK: { icon: Package, color: "text-amber-500" },
  DUE_PAYMENT: { icon: DollarSign, color: "text-rose-500" },
  ONLINE_PREORDER: { icon: ShoppingBag, color: "text-blue-500" },
  LARGE_SALE: { icon: TrendingUp, color: "text-emerald-500" },
  STOCK_TRANSFER: { icon: ArrowRightLeft, color: "text-indigo-500" },
  GENERAL: { icon: Info, color: "text-slate-500" },
};

function NotificationItem({
  notif,
  onRead,
  onNavigate,
}: {
  notif: Notification;
  onRead: (id: number) => void;
  onNavigate: (link: string) => void;
}) {
  const kind = kindIconMap[notif.kind] || kindIconMap.GENERAL;
  const Icon = kind.icon;

  return (
    <button
      className={`w-full text-left px-4 py-3 transition-colors hover:bg-slate-50 ${
        notif.is_read ? "opacity-60" : ""
      }`}
      onClick={() => {
        if (!notif.is_read) onRead(notif.id);
        if (notif.link) onNavigate(notif.link);
      }}
    >
      <div className="flex gap-3">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 ${kind.color}`}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium leading-tight truncate">
              {notif.title}
            </p>
            {!notif.is_read && (
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
            )}
          </div>
          {notif.body && (
            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
              {notif.body}
            </p>
          )}
          <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
            <span>
              {formatDistanceToNow(new Date(notif.created_at), {
                addSuffix: true,
              })}
            </span>
            {notif.branch_name && (
              <>
                <span>·</span>
                <span>{notif.branch_name}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

export function NotificationsDrawer() {
  const router = useRouter();
  const { data: unreadCount = 0 } = useUnreadCount();
  const { data, isLoading } = useNotifications();
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();

  const notifications = data?.results ?? [];

  const handleNavigate = (link: string) => {
    router.push(link);
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 text-[10px] font-bold bg-rose-500 hover:bg-rose-500 border-2 border-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[380px] sm:w-[420px] p-0">
        <SheetHeader className="px-4 pt-4 pb-2">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg">Notifications</SheetTitle>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-blue-600 hover:text-blue-700"
                onClick={() => markAllRead.mutate()}
                disabled={markAllRead.isPending}
              >
                <CheckCheck className="h-3.5 w-3.5 mr-1" />
                Mark all read
              </Button>
            )}
          </div>
        </SheetHeader>
        <Separator />
        <ScrollArea className="h-[calc(100vh-80px)]">
          {isLoading ? (
            <div className="space-y-4 p-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <div className="h-9 w-9 rounded-full bg-slate-100" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-1/2 bg-slate-100 rounded" />
                    <div className="h-2 w-full bg-slate-100 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center px-4">
              <Bell className="h-10 w-10 text-slate-300 mb-3" />
              <p className="text-sm font-medium text-slate-600">
                All caught up!
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                No notifications at the moment.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notif) => (
                <NotificationItem
                  key={notif.id}
                  notif={notif}
                  onRead={(id) => markRead.mutate(id)}
                  onNavigate={handleNavigate}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
