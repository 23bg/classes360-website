import { BillingProviderKey, BillingRegion } from "@/features/billing/billing.types";

const normalizeValue = (value?: string | null) => (value ?? "").trim().toUpperCase();

export const detectBillingRegion = (country?: string | null): BillingRegion => {
    const normalized = normalizeValue(country);

    if (!normalized) {
        return "UNKNOWN";
    }

    if (normalized === "IN" || normalized === "INDIA") {
        return "IN";
    }

    return "GLOBAL";
};

export const resolveBillingProvider = (country?: string | null, preferredProvider?: BillingProviderKey | null): BillingProviderKey | null => {
    if (preferredProvider) {
        return preferredProvider;
    }

    const region = detectBillingRegion(country);
    if (region === "IN") {
        return "RAZORPAY";
    }

    if (region === "GLOBAL") {
        return "STRIPE";
    }

    return null;
};

export const getRegionLabel = (region: BillingRegion): string => {
    if (region === "IN") {
        return "India";
    }

    if (region === "GLOBAL") {
        return "International";
    }

    return "Manual selection required";
};
