"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getStudentPortal, loginStudentPortal, logoutStudentPortal } from "@/features/studentPortal/studentPortalApi";
import type { PortalData } from "@/features/studentPortal/types";
import { useStudentPortalStore } from "@/stores/studentPortalStore";

const studentPortalQueryKey = ["studentPortal", "me"] as const;

export function useStudentPortalData() {
    return useQuery<PortalData>({
        queryKey: studentPortalQueryKey,
        queryFn: getStudentPortal,
    });
}

export function useStudentPortalLogin() {
    const queryClient = useQueryClient();
    const setAuthLoading = useStudentPortalStore((state) => state.setAuthLoading);

    return useMutation({
        mutationFn: loginStudentPortal,
        onMutate: () => setAuthLoading(true),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: studentPortalQueryKey });
        },
        onSettled: () => setAuthLoading(false),
    });
}

export function useStudentPortalLogout() {
    const queryClient = useQueryClient();
    const setAuthLoading = useStudentPortalStore((state) => state.setAuthLoading);

    return useMutation({
        mutationFn: logoutStudentPortal,
        onMutate: () => setAuthLoading(true),
        onSuccess: async () => {
            queryClient.removeQueries({ queryKey: studentPortalQueryKey });
        },
        onSettled: () => setAuthLoading(false),
    });
}

export function useStudentPortalAuthLoading() {
    return useStudentPortalStore((state) => state.authLoading);
}
