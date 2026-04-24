"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStudentPortalData } from "@/features/studentPortal/useStudentPortal";

type StudentPortalGuardProps = {
    children: React.ReactNode;
};

export default function StudentPortalGuard({ children }: StudentPortalGuardProps) {
    const router = useRouter();
    const { data, isLoading, isError } = useStudentPortalData();

    useEffect(() => {
        if (isLoading) {
            return;
        }

        if (!data || isError) {
            router.replace("/student-login");
        }
    }, [data, isError, isLoading, router]);

    if (isLoading) {
        return null;
    }

    if (!data || isError) {
        return null;
    }

    return <>{children}</>;
}