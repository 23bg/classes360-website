import React from "react";
import { Metadata } from "next";
import AuthGuard from "@/components/auth/AuthGuard";
import { DashboardLayoutWithProviders } from "@/providers/DashboardLayoutWithProviders";

export const metadata: Metadata = {
    title: "Dashboard",
    description:
        "Classes360 Dashboard - Manage admissions, leads, students, teachers, and billing.",
    robots: {
        index: false,
        follow: false,
    },
};

export default function AppLayout({
    children
}: {
    children: React.ReactNode
}) {
    return (
        <AuthGuard>
            <DashboardLayoutWithProviders showFirstLoginShowcase={true}>
                {children}
            </DashboardLayoutWithProviders>
        </AuthGuard>
    );
}


