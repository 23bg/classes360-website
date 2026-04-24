import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import { DASHBOARD_QUERY_KEYS } from "@/features/dashboard/hooks/queries/useDashboardData";

type SavePayload = { editingId: string | null; body: Record<string, unknown> };

export function useSaveCourse() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ editingId, body }: SavePayload) => {
            const endpoint = editingId ? `/courses/${editingId}` : "/courses";
            const method = editingId ? "PUT" : "POST";
            return apiFetch(endpoint, { method, body: JSON.stringify(body) });
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEYS.courses });
        },
    });
}

export function useDeleteCourse() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => apiFetch(`/courses/${id}`, { method: "DELETE" }),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEYS.courses });
        },
    });
}

export function usePostAnnouncement() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (payload: { title: string; body: string }) =>
            apiFetch("/announcements", { method: "POST", body: JSON.stringify(payload) }),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEYS.overview });
        },
    });
}

export function useSaveInstituteProfile() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (payload: Record<string, unknown>) =>
            apiFetch("/institute", { method: "PUT", body: JSON.stringify(payload) }),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEYS.profile });
        },
    });
}

export function useUpdateNotificationSetting() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ key, value }: { key: string; value: boolean }) =>
            apiFetch("/institute/notifications", {
                method: "PUT",
                body: JSON.stringify({ [key]: value }),
            }),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEYS.notificationSettings });
        },
    });
}

export function useSaveFeePlan() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (payload: Record<string, unknown>) =>
            apiFetch("/fees", { method: "POST", body: JSON.stringify(payload) }),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEYS.feesDashboard });
        },
    });
}

export function useDeleteFeePlan() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (planId: string) => apiFetch(`/fees/${planId}`, { method: "DELETE" }),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEYS.feesDashboard });
        },
    });
}

export function useAddFeePlanPayment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ planId, body }: { planId: string; body: Record<string, unknown> }) =>
            apiFetch(`/fees/${planId}/installments`, { method: "POST", body: JSON.stringify(body) }),
        onSuccess: async (_, variables) => {
            await queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEYS.feesDashboard });
            await queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEYS.feePlanPayments(variables.planId) });
        },
    });
}

export function useConnectWhatsapp() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (phoneNumber: string) =>
            apiFetch("/institute/whatsapp", {
                method: "POST",
                body: JSON.stringify({ action: "connect", phoneNumber }),
            }),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEYS.whatsappIntegration });
        },
    });
}

export function useVerifyWhatsapp() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (otp: string) =>
            apiFetch("/institute/whatsapp", {
                method: "POST",
                body: JSON.stringify({ action: "verify", otp }),
            }),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEYS.whatsappIntegration });
        },
    });
}

export function useActivateWhatsapp() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (payload: { phoneNumberId: string; businessAccountId: string }) =>
            apiFetch("/institute/whatsapp", {
                method: "POST",
                body: JSON.stringify({ action: "activate", ...payload }),
            }),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEYS.whatsappIntegration });
        },
    });
}
