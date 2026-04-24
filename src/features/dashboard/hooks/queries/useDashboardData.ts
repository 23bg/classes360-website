import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";

const DASHBOARD_QUERY_KEYS = {
    courses: ["dashboard", "courses"] as const,
    defaulters: ["dashboard", "defaulters"] as const,
    payments: (queryString: string) => ["dashboard", "payments", queryString] as const,
    overview: ["dashboard", "overview"] as const,
    profile: ["dashboard", "profile"] as const,
    notificationSettings: ["dashboard", "notification-settings"] as const,
    integrations: ["dashboard", "integrations"] as const,
    feesDashboard: ["dashboard", "fees"] as const,
    feePlanPayments: (planId?: string | null) => ["dashboard", "fee-payments", planId ?? "none"] as const,
    whatsappIntegration: ["dashboard", "whatsapp-integration"] as const,
};

const asArray = <T>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

const asObject = <T extends Record<string, unknown>>(value: unknown, fallback: T): T => {
    if (value && typeof value === "object") {
        return value as T;
    }

    return fallback;
};

export function useCourses() {
    return useQuery<any[]>({
        queryKey: DASHBOARD_QUERY_KEYS.courses,
        queryFn: async () => asArray(await apiFetch("/courses")),
        staleTime: 30_000,
    });
}

export function useDefaulters() {
    return useQuery<any[]>({
        queryKey: DASHBOARD_QUERY_KEYS.defaulters,
        queryFn: async () => asArray(await apiFetch("/dashboard/defaulters")),
        staleTime: 30_000,
    });
}

export function usePayments(queryString = "") {
    return useQuery<any[]>({
        queryKey: DASHBOARD_QUERY_KEYS.payments(queryString),
        queryFn: async () => {
            const suffix = queryString ? `?${queryString}` : "";
            return asArray(await apiFetch(`/payments${suffix}`));
        },
        staleTime: 30_000,
    });
}

export function useDashboardOverview() {
    return useQuery<any>({
        queryKey: DASHBOARD_QUERY_KEYS.overview,
        queryFn: async () => asObject(await apiFetch("/dashboard/overview"), { metrics: null, defaulters: [] as unknown[] }),
        staleTime: 30_000,
    });
}

export function useInstituteProfile() {
    return useQuery<any>({
        queryKey: DASHBOARD_QUERY_KEYS.profile,
        queryFn: async () => asObject(await apiFetch("/institute"), {}),
        staleTime: 30_000,
    });
}

export function useNotificationSettings() {
    return useQuery<any>({
        queryKey: DASHBOARD_QUERY_KEYS.notificationSettings,
        queryFn: async () =>
            asObject(await apiFetch("/institute/notifications"), {
                newEnquiryAlert: true,
                followUpReminder: true,
                leadAssigned: true,
                paymentReceived: true,
                admissionConfirmed: true,
            }),
        staleTime: 30_000,
    });
}

export function useIntegrations() {
    return useQuery<any[]>({
        queryKey: DASHBOARD_QUERY_KEYS.integrations,
        queryFn: async () => asArray(await apiFetch("/integrations")),
        staleTime: 30_000,
    });
}

export function useFeesDashboard() {
    return useQuery<any>({
        queryKey: DASHBOARD_QUERY_KEYS.feesDashboard,
        queryFn: async () => {
            const [students, plans] = await Promise.all([
                apiFetch("/students").catch(() => []),
                apiFetch("/fees").catch(() => []),
            ]);

            return {
                students: asArray(students),
                plans: asArray(plans),
            };
        },
        staleTime: 30_000,
    });
}

export function useFeePlanPayments(planId?: string | null) {
    return useQuery<any[]>({
        queryKey: DASHBOARD_QUERY_KEYS.feePlanPayments(planId),
        queryFn: async () => {
            if (!planId) {
                return [] as unknown[];
            }

            return asArray(await apiFetch(`/fees/${planId}/installments`));
        },
        enabled: Boolean(planId),
        staleTime: 30_000,
    });
}

export function useWhatsappIntegration() {
    return useQuery<any>({
        queryKey: DASHBOARD_QUERY_KEYS.whatsappIntegration,
        queryFn: async () =>
            asObject(await apiFetch("/institute/whatsapp"), {
                mode: "CLASSES360_SHARED",
                connectedNumber: null,
                status: "DISCONNECTED",
                phoneNumberId: null,
                businessAccountId: null,
                connectedAt: null,
            }),
        staleTime: 30_000,
    });
}

export { DASHBOARD_QUERY_KEYS };
