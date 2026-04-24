import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";

export type CurrentUserResponse = {
    user?: Record<string, unknown> | null;
    role?: string | null;
    redirectTo?: string | null;
};

export const useCurrentUser = () =>
    useQuery<CurrentUserResponse>({
        queryKey: ["auth", "me"],
        queryFn: () => apiFetch<CurrentUserResponse>("/auth/me"),
        retry: false,
    });