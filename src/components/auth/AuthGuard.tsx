"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { useAuthStore } from "@/stores/authStore";

type AuthGuardProps = {
    children: React.ReactNode;
    guestOnly?: boolean;
    redirectTo?: string;
};

export default function AuthGuard({ children, guestOnly = false, redirectTo }: AuthGuardProps) {
    const router = useRouter();
    const { data, isLoading, isError } = useCurrentUser();
    const user = data?.user ?? null;
    const setUser = useAuthStore((state) => state.setUser);
    const setAuthenticated = useAuthStore((state) => state.setAuthenticated);

    useEffect(() => {
        setUser(user);
        setAuthenticated(Boolean(user));
    }, [setAuthenticated, setUser, user]);

    useEffect(() => {
        if (isLoading) {
            return;
        }

        if (guestOnly) {
            if (user && !isError) {
                router.replace(redirectTo ?? "/overview");
            }

            return;
        }

        if (!user || isError) {
            router.replace(redirectTo ?? "/login");
        }
    }, [guestOnly, isError, isLoading, redirectTo, router, user]);

    if (isLoading) {
        return null;
    }

    if (guestOnly) {
        if (user && !isError) {
            return null;
        }

        return <>{children}</>;
    }

    if (!user || isError) {
        return null;
    }

    return <>{children}</>;
}