import type { Metadata } from "next";
import StudentPortalHeader from "@/components/student/StudentPortalHeader";
import StudentPortalFooter from "@/components/student/StudentPortalFooter";
import StudentPortalGuard from "@/components/auth/StudentPortalGuard";

export const metadata: Metadata = {
    robots: {
        index: false,
        follow: false,
    },
};

export default function StudentLayout({ children }: { children: React.ReactNode }) {
    return (
        <StudentPortalGuard>
            <div className="min-h-screen bg-muted/20">
                <StudentPortalHeader />
                <main className="mx-auto max-w-6xl p-4 md:p-6">{children}</main>
                <StudentPortalFooter />
            </div>
        </StudentPortalGuard>
    );
}
