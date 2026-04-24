import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    activateDomain,
    createPublicEnquiry,
    getDomainSettings,
    getExportResources,
    getOnboardingInstitute,
    getSettingsCountsResources,
    getInstituteSummaryResources,
    postOnboarding,
    putDomainSettings,
    verifyDomain,
} from "@/features/appInstitute/appInstituteApi";

export type InstituteSummary = {
    form: Record<string, any>;
    studentsCount: number;
    coursesCount: number;
};

const instituteSummaryQueryKey = ["appInstitute", "summary"] as const;
const onboardingQueryKey = ["appInstitute", "onboarding"] as const;
const settingsCountsQueryKey = ["appInstitute", "settingsCounts"] as const;
const domainSettingsQueryKey = ["appInstitute", "domainSettings"] as const;

export function useInstituteSummary() {
    return useQuery<InstituteSummary>({
        queryKey: instituteSummaryQueryKey,
        queryFn: async () => {
            const { institute, students, courses } = await getInstituteSummaryResources();

            const address = institute?.address ?? {};
            const socialLinks = institute?.socialLinks ?? {};

            return {
                form: {
                    name: institute?.name ?? "",
                    slug: institute?.slug ?? "",
                    description: institute?.description ?? "",
                    phone: institute?.phone ?? "",
                    whatsapp: institute?.whatsapp ?? "",
                    addressLine1: address?.addressLine1 ?? "",
                    addressLine2: address?.addressLine2 ?? "",
                    city: address?.city ?? "",
                    state: address?.state ?? "",
                    region: address?.region ?? "",
                    postalCode: address?.postalCode ?? "",
                    country: address?.country ?? "India",
                    countryCode: address?.countryCode ?? "",
                    timings: institute?.timings ?? "",
                    logo: institute?.logo ?? "",
                    banner: institute?.banner ?? "",
                    website: socialLinks?.website ?? "",
                    instagram: socialLinks?.instagram ?? "",
                    facebook: socialLinks?.facebook ?? "",
                    youtube: socialLinks?.youtube ?? "",
                    linkedin: socialLinks?.linkedin ?? "",
                },
                studentsCount: students?.length ?? 0,
                coursesCount: courses?.length ?? 0,
            };
        },
        staleTime: 30_000,
    });
}

export function useOnboardingInstitute() {
    return useQuery<Record<string, unknown>>({
        queryKey: onboardingQueryKey,
        queryFn: getOnboardingInstitute,
        staleTime: 30_000,
    });
}

export function useSubmitOnboarding() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: Record<string, unknown>) => postOnboarding(payload),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: onboardingQueryKey });
            await queryClient.invalidateQueries({ queryKey: instituteSummaryQueryKey });
        },
    });
}

export function useSettingsCounts() {
    return useQuery({
        queryKey: settingsCountsQueryKey,
        queryFn: async () => {
            const { studentsRes, leadsRes, coursesRes, paymentsRes } = await getSettingsCountsResources();
            return {
                students: studentsRes?.length ?? 0,
                leads: leadsRes?.length ?? 0,
                courses: coursesRes?.length ?? 0,
                payments: paymentsRes?.length ?? 0,
            };
        },
        staleTime: 30_000,
    });
}

export function useDomainSettings() {
    return useQuery({
        queryKey: domainSettingsQueryKey,
        queryFn: getDomainSettings,
        staleTime: 30_000,
    });
}

export function useSaveDomainSettings() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (customDomain: string) => putDomainSettings(customDomain),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: domainSettingsQueryKey });
        },
    });
}

export function useVerifyDomainSettings() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (customDomain: string) => verifyDomain(customDomain),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: domainSettingsQueryKey });
        },
    });
}

export function useActivateDomainSettings() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (customDomain: string) => activateDomain(customDomain),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: domainSettingsQueryKey });
        },
    });
}

export function useSubmitPublicEnquiry(slug: string) {
    return useMutation({
        mutationFn: (values: Record<string, unknown>) => createPublicEnquiry(slug, values),
    });
}

export function useExportSettingsData() {
    return useMutation({
        mutationFn: getExportResources,
    });
}
