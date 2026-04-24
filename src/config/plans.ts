export type PlanType = "STARTER" | "TEAM" | "GROWTH" | "SCALE";
export type PricingVersion = "LEGACY" | "CURRENT";

export type PlanPricing = {
    monthly: number | null;
    yearly: number | null;
};

type PlanConfig = {
    key: PlanType;
    name: string;
    priceMonthly: number | null;
    priceYearly: number | null;
    /** null means unlimited */
    userLimit: number | null;
    studentLimit: number | null;
    enquiryLimit: number | null;
    tagline: string;
};

export const PLAN_CONFIG: Record<PlanType, PlanConfig> = {
    STARTER: {
        key: "STARTER",
        name: "Starter",
        priceMonthly: 1999,
        priceYearly: 19990,
        userLimit: 2,
        studentLimit: 250,
        enquiryLimit: 1000,
        tagline: "For solo institute owners starting admissions management",
    },
    TEAM: {
        key: "TEAM",
        name: "Team",
        priceMonthly: 3999,
        priceYearly: 39990,
        userLimit: 8,
        studentLimit: 800,
        enquiryLimit: 4000,
        tagline: "For small admission teams collaborating daily",
    },
    GROWTH: {
        key: "GROWTH",
        name: "Growth",
        priceMonthly: 7999,
        priceYearly: 79990,
        userLimit: 20,
        studentLimit: 2000,
        enquiryLimit: 10000,
        tagline: "For institutes scaling admissions volume",
    },
    SCALE: {
        key: "SCALE",
        name: "Scale",
        // Custom enterprise pricing is handled via sales.
        priceMonthly: null,
        priceYearly: null,
        userLimit: null,
        studentLimit: null,
        enquiryLimit: null,
        tagline: "For large institutes with multiple counselors and high volume",
    },
};

export const DEFAULT_PLAN_TYPE: PlanType = "STARTER";

// Existing institutes created before this timestamp are grandfathered on legacy prices.
export const PRICING_V2_EFFECTIVE_AT = new Date("2026-03-16T00:00:00+05:30");

export const PLAN_PRICING_LEGACY: Record<PlanType, PlanPricing> = {
    STARTER: { monthly: 399, yearly: 3990 },
    TEAM: { monthly: 899, yearly: 8990 },
    GROWTH: { monthly: 1799, yearly: 17990 },
    SCALE: { monthly: 3999, yearly: 39990 },
};

export const PLAN_PRICING_CURRENT: Record<PlanType, PlanPricing> = {
    STARTER: { monthly: 1999, yearly: 19990 },
    TEAM: { monthly: 3999, yearly: 39990 },
    GROWTH: { monthly: 7999, yearly: 79990 },
    SCALE: { monthly: null, yearly: null },
};

export const AUTOMATION_PACK_PRICING: PlanPricing = {
    monthly: 499,
    yearly: 4990,
};

export const EXTRA_USER_COST = 299;
export const EXTRA_STUDENT_COST = 5;

export const isGrandfatheredSubscription = (createdAt?: Date | null): boolean => {
    if (!createdAt) {
        return false;
    }

    return createdAt.getTime() < PRICING_V2_EFFECTIVE_AT.getTime();
};

export const getPlanPricing = (
    planType: PlanType,
    options?: { grandfathered?: boolean; version?: PricingVersion }
): PlanPricing => {
    const version = options?.version ?? (options?.grandfathered ? "LEGACY" : "CURRENT");
    return version === "LEGACY" ? PLAN_PRICING_LEGACY[planType] : PLAN_PRICING_CURRENT[planType];
};

export const isPlanType = (value: string): value is PlanType =>
    value === "STARTER" || value === "TEAM" || value === "GROWTH" || value === "SCALE";

/** Returns true when the plan has no user-count cap */
export const isUnlimitedUsers = (limit: number | null): boolean => limit === null;