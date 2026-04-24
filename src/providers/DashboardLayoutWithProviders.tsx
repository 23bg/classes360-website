'use client';

import DashboardLayout from '@/components/layout/dashboard/DashboardLayout';
import React from 'react';

export function DashboardLayoutWithProviders({
    children,
    showFirstLoginShowcase,
}: {
    children: React.ReactNode;
    showFirstLoginShowcase: boolean;
}) {
    return (
        <DashboardLayout showFirstLoginShowcase={showFirstLoginShowcase}>
            {children}
        </DashboardLayout>
    );
}
