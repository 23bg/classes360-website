"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import ImraboChat from "@/features/ai/components/ImraboChat";
import UserMenu from "@/features/auth/components/UserMenu";
import GlobalSearch from "@/components/layout/dashboard/GlobalSearch";
import ROUTES from "@/constants/routes";
import { Bell, Building2, CircleHelp } from "lucide-react";
import api from "@/lib/axios";
import { API } from "@/constants/api";


import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

const routeLabelMap: Record<string, string> = {
    dashboard: "Dashboard",
    leads: "Leads",
    students: "Students",
    team: "Team",
    courses: "Courses",
    batches: "Batches",
    fees: "Fees",
    payments: "Payments",
    institute: "Institute",
    settings: "Settings",
    billing: "Billing",
    profile: "Profile",
};

const toTitleCase = (value: string) =>
    value
        .split("-")
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");

export default function DashboardHeader() {
    const pathname = usePathname();
    const segments = pathname.split("/").filter(Boolean);

    const [notifications, setNotifications] = useState<Array<{
        id: string;
        title: string;
        message: string;
        link?: string | null;
        read: boolean;
        createdAt: string;
    }>>([]);
    const [loadingNotifications, setLoadingNotifications] = useState(false);

    const crumbs = segments.map((segment, index) => {
        const href = `/${segments.slice(0, index + 1).join("/")}`;
        const label = routeLabelMap[segment] ?? toTitleCase(segment);
        return { href, label };
    });

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                setLoadingNotifications(true);
                const res = await api.get(API.INTERNAL.NOTIFICATIONS.ADMIN + "?limit=50");
                const data = res.data?.data ?? [];
                if (mounted) setNotifications(data);
            } catch (err) {
                console.error("fetch notifications failed", err);
            } finally {
                if (mounted) setLoadingNotifications(false);
            }
        })();

        return () => {
            mounted = false;
        };
    }, []);

    return (
        <header id="dashboard-header" className="flex h-16 border-b items-center justify-between px-4 bg-background dark:bg-zinc-900/40 backdrop-blur-sm rounded-t-2xl">
            <div className="flex items-center gap-3 min-w-0">
                <div className="hidden md:block">
                    <SidebarTrigger />
                </div>

                {/* Mobile breadcrumb / page title */}
                <div className="flex md:hidden items-center gap-2 text-sm text-muted-foreground truncate">
                    <span className="text-xl text-primary font-medium truncate">Classes360</span>
                </div>

                <nav aria-label="Breadcrumb" className="hidden md:flex items-center gap-2 text-sm text-muted-foreground truncate">
                    <Link href={ROUTES.DASHBOARD.ROOT} className="hover:text-foreground transition-colors">
                        Dashboard
                    </Link>

                    {crumbs
                        .filter((crumb) => crumb.href !== ROUTES.DASHBOARD.ROOT)
                        .map((crumb, index, arr) => {
                            const isLast = index === arr.length - 1;
                            return (
                                <span key={crumb.href} className="flex items-center gap-2 min-w-0">
                                    <span>/</span>
                                    {isLast ? (
                                        <span className="text-foreground truncate">{crumb.label}</span>
                                    ) : (
                                        <Link href={crumb.href} className="hover:text-foreground transition-colors truncate">
                                            {crumb.label}
                                        </Link>
                                    )}
                                </span>
                            );
                        })}
                </nav>
            </div>

            <div className="flex items-center gap-3">
                <GlobalSearch />
                <ImraboChat />
                <Button asChild variant="outline" size="icon" aria-label="Notifications">
                    <Link href={ROUTES.DASHBOARD.INSTITUTE}>
                        <Building2 className="h-4 w-4" />
                    </Link>
                </Button>

                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" size="icon" className="relative" aria-label="Notifications">
                            <Bell className="h-4 w-4" />

                            {/* unread badge */}
                            <span className="absolute -top-1 -right-1">
                                <Badge variant="destructive" className="h-4 w-4 p-0 text-[10px] flex items-center justify-center">
                                    {notifications.filter((n) => !n.read).length}
                                </Badge>
                            </span>
                        </Button>
                    </PopoverTrigger>

                    <PopoverContent align="end" className="w-80 p-0">
                        <div className="flex items-center justify-between px-4 py-2 border-b bg-zinc-50 dark:bg-zinc-800">
                            <span className="text-sm font-medium">Notifications</span>
                            <button
                                className="text-xs text-muted-foreground hover:text-foreground"
                                onClick={async () => {
                                    try {
                                        const unread = notifications.filter((n) => !n.read).map((n) => n.id);
                                        if (unread.length === 0) return;
                                        await Promise.all(
                                            unread.map((id) => api.patch(API.INTERNAL.NOTIFICATIONS.ADMIN, { id, read: true }))
                                        );
                                        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
                                    } catch (err) {
                                        console.error("mark all read failed", err);
                                    }
                                }}
                            >
                                Mark all read
                            </button>
                        </div>
                        <ScrollArea className="h-80 bg-zinc-50 dark:bg-zinc-800">
                            <div className="flex flex-col">
                                {loadingNotifications ? (
                                    <div className="px-4 py-3 text-sm text-muted-foreground">Loading...</div>
                                ) : notifications.length === 0 ? (
                                    <div className="px-4 py-3 text-sm text-muted-foreground">No notifications</div>
                                ) : (
                                    notifications.map((n) => (
                                        <div
                                            key={n.id}
                                            className={`px-4 py-3 hover:bg-muted/50 cursor-pointer flex items-start gap-2 ${n.read ? "opacity-70" : ""}`}
                                            onClick={async () => {
                                                try {
                                                    if (n.link) {
                                                        window.location.href = n.link;
                                                    }
                                                    if (!n.read) {
                                                        await api.patch(API.INTERNAL.NOTIFICATIONS.ADMIN, { id: n.id, read: true });
                                                        setNotifications((prev) => prev.map((p) => (p.id === n.id ? { ...p, read: true } : p)));
                                                    }
                                                } catch (err) {
                                                    console.error("mark read failed", err);
                                                }
                                            }}
                                        >
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{n.title}</p>
                                                <p className="text-xs text-muted-foreground truncate">{n.message}</p>
                                            </div>

                                            <div className="text-xs text-muted-foreground whitespace-nowrap">
                                                {new Date(n.createdAt).toLocaleString()}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </ScrollArea>

                        {/* <div className="p-2 border-t text-center">
                            <Link
                                href="/settings/notifications"
                                className="text-xs text-primary hover:underline"
                            >
                                View all notifications
                            </Link>
                        </div> */}
                    </PopoverContent>
                </Popover>

                <UserMenu />
                {/* <Button asChild variant="ghost" size="icon" aria-label="Help Center">
                    <Link href={ROUTES.HELP}>
                        <CircleHelp className="h-4 w-4" />
                    </Link>
                </Button> */}
            </div>
        </header>
    );
}

