"use client";

import Link from "next/link";
import { Home, UserPlus, Users, BookOpen, User } from "lucide-react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import ROUTES from "@/constants/routes";
import { api } from "@/lib/axios";
import { API } from "@/constants/api";
import { Badge } from "@/components/ui/badge";
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import DashboardHeader from "@/components/layout/dashboard/DashboardHeader";

const DashboardAppSidebar = dynamic(
    () => import("@/components/dashboard/side-bar").then((mod) => mod.DashboardAppSidebar)
);
const DashboardShowcaseTour = dynamic(
    () => import("@/components/dashboard/DashboardShowcaseTour")
);

export default function DashboardLayout({
    children,
    showFirstLoginShowcase = false,
}: {
    children: React.ReactNode;
    showFirstLoginShowcase?: boolean;
}) {
    const pathname = usePathname();
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const res = await api.get(API.INTERNAL.NOTIFICATIONS.ADMIN + "?limit=50");
                const data = res.data?.data ?? [];
                if (!mounted) return;
                setUnreadCount(data.filter((n: any) => !n.read).length ?? 0);
            } catch (err) {
                // noop
            }
        })();

        return () => {
            mounted = false;
        };
    }, [pathname]);
    return (
        <DashboardShowcaseTour enabled={showFirstLoginShowcase}>
            <SidebarProvider className="overflow-hidden h-screen font-sans">
                <DashboardAppSidebar />

                <SidebarInset className="border-none shadow-none bg-muted/30 backdrop-blur-sm rounded-2xl">
                    <DashboardHeader />

                    {/* MAIN CONTENT */}
                    <main className="overflow-hidden">
                        <div className="h-screen">
                            <ScrollArea className="h-full pb-16 md:pb-0">
                                {children}
                                <div className="h-30"></div>
                            </ScrollArea>
                        </div>
                    </main>
 {/* FOOTER (desktop only) */}
                    <footer className="hidden md:block border-t bg-background dark:bg-zinc-900/40 backdrop-blur-sm rounded-b-2xl">
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-2 px-6 py-3 text-xs text-muted-foreground">
                            {/* COPYRIGHT */}
                            <span>© 2026 Classes360. Built for coaching institutes.</span>

                            {/* LINKS */}
                            <div className="flex items-center gap-2">
                                <Link href="/help" className="hover:text-foreground transition">
                                    Help
                                </Link>

                                <Link href="/contact" className="hover:text-foreground transition">
                                    Contact
                                </Link>

                                <Link href="/about" className="hover:text-foreground transition">
                                    About
                                </Link>
                            </div>
                        </div>
                    </footer>

                </SidebarInset>
                   

                    {/* Mobile bottom navigation */}
                    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-background dark:bg-zinc-900/40">
                        <nav className="flex justify-between items-center h-14 px-4">
                            <Link href={ROUTES.DASHBOARD.ROOT} className={`flex flex-col items-center text-xs ${pathname?.startsWith(ROUTES.DASHBOARD.ROOT) ? "text-primary" : "text-muted-foreground"}`}>
                                <Home className="h-5 w-5" />
                                <span className="mt-1">Overview</span>
                            </Link>

                            <Link href={ROUTES.DASHBOARD.LEADS} className={`flex flex-col items-center text-xs ${pathname?.startsWith(ROUTES.DASHBOARD.LEADS) ? "text-primary" : "text-muted-foreground"}`}>
                                <UserPlus className="h-5 w-5" />
                                <span className="mt-1">Leads</span>
                            </Link>

                            <Link href={ROUTES.DASHBOARD.STUDENTS} className={`flex flex-col items-center text-xs ${pathname?.startsWith(ROUTES.DASHBOARD.STUDENTS) ? "text-primary" : "text-muted-foreground"}`}>
                                <Users className="h-5 w-5" />
                                <span className="mt-1">Students</span>
                            </Link>

                            <Link href={ROUTES.DASHBOARD.COURSES} className={`flex flex-col items-center text-xs ${pathname?.startsWith(ROUTES.DASHBOARD.COURSES) ? "text-primary" : "text-muted-foreground"}`}>
                                <BookOpen className="h-5 w-5" />
                                <span className="mt-1">Courses</span>
                            </Link>

                            <Link href={ROUTES.DASHBOARD.PROFILE} className={`flex flex-col items-center text-xs relative ${pathname?.startsWith(ROUTES.DASHBOARD.PROFILE) ? "text-primary" : "text-muted-foreground"}`}>
                                <User className="h-5 w-5" />
                                {unreadCount > 0 && (
                                    <Badge variant="destructive" className="absolute -top-1 -right-2 h-4 w-4 p-0 text-[10px] flex items-center justify-center">
                                        {unreadCount}
                                    </Badge>
                                )}
                                <span className="mt-1">Profile</span>
                            </Link>
                        </nav>
                    </div>
                </SidebarProvider>
            </DashboardShowcaseTour>
        );
    }
            