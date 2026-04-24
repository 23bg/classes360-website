import AuthGuard from "@/components/auth/AuthGuard";
import AuthLayout from '@/components/layout/AuthLayout'
import type { Metadata } from "next";
import React from 'react'

export const metadata: Metadata = {
    robots: {
        index: false,
        follow: false,
    },
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <AuthLayout>
            <AuthGuard guestOnly>{children}</AuthGuard>
        </AuthLayout>
    );
}


