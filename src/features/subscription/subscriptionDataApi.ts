import { prisma } from "@/lib/db/prisma";
import { DEFAULT_PLAN_TYPE, PLAN_CONFIG, PlanType } from "@/config/plans";

const mapPlanTypeToDb = (planType: PlanType) => {
    // Prisma enum currently uses SOLO/TEAM. Map app-level plans to DB enum.
    switch (planType) {
        case "STARTER":
            return "SOLO" as const;
        case "TEAM":
        case "GROWTH":
        case "SCALE":
            return "TEAM" as const;
        default:
            return "SOLO" as const;
    }
};

export const subscriptionRepository = {
    createTrial: async (instituteId: string, planType: PlanType = DEFAULT_PLAN_TYPE) =>
        prisma.subscription.upsert({
            where: { instituteId },
            create: {
                instituteId,
                billingProvider: null,
                planType: mapPlanTypeToDb(planType),
                // 0 is stored as the sentinel value for "unlimited" (null in PlanConfig)
                userLimit: PLAN_CONFIG[planType].userLimit ?? 0,
                status: "TRIAL",
                trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            },
            update: {},
        }),

    findByInstituteId: async (instituteId: string) =>
        prisma.subscription.findUnique({
            where: { instituteId },
        }),

    findByRazorpaySubId: async (razorpaySubId: string) =>
        prisma.subscription.findFirst({
            where: { razorpaySubId },
        }),

    updateByInstituteId: async (
        instituteId: string,
        payload: {
            status?: "TRIAL" | "ACTIVE" | "PAST_DUE" | "INACTIVE" | "CANCELLED";
            currentPeriodEnd?: Date | null;
            currentPeriodStart?: Date | null;
            razorpaySubId?: string | null;
            providerSubscriptionId?: string | null;
            providerPaymentId?: string | null;
            billingProvider?: "RAZORPAY" | "STRIPE" | null;
            currency?: string;
            trialEndsAt?: Date | null;
            planType?: PlanType;
            userLimit?: number;
            billingInterval?: "MONTHLY" | "YEARLY";
            lastChargedAt?: Date | null;
            autopayEnabled?: boolean;
            paymentMethodAddedAt?: Date | null;
        }
    ) =>
        prisma.subscription.update({
            where: { instituteId },
            data: {
                ...payload,
                ...(payload.planType ? { planType: mapPlanTypeToDb(payload.planType) } : {}),
            } as any,
        }),

    upsertByRazorpaySubId: async (
        razorpaySubId: string,
        instituteId: string,
        payload: {
            status?: "TRIAL" | "ACTIVE" | "PAST_DUE" | "INACTIVE" | "CANCELLED";
            currentPeriodStart?: Date | null;
            currentPeriodEnd?: Date | null;
            currentPeriodStart?: Date | null;
            trialEndsAt?: Date | null;
            billingProvider?: "RAZORPAY" | "STRIPE" | null;
            providerSubscriptionId?: string | null;
            providerPaymentId?: string | null;
            currency?: string;
            planType?: PlanType;
            userLimit?: number;
            billingInterval?: "MONTHLY" | "YEARLY";
            lastChargedAt?: Date | null;
            autopayEnabled?: boolean;
            paymentMethodAddedAt?: Date | null;
            billingProvider?: "RAZORPAY" | "STRIPE" | null;
            providerSubscriptionId?: string | null;
            providerPaymentId?: string | null;
            currency?: string;
        }
    ) =>
        prisma.subscription.upsert({
            where: { instituteId },
            create: {
                instituteId,
                billingProvider: payload.billingProvider ?? null,
                razorpaySubId,
                providerSubscriptionId: payload.providerSubscriptionId ?? razorpaySubId,
                providerPaymentId: payload.providerPaymentId ?? null,
                planType: mapPlanTypeToDb(payload.planType ?? DEFAULT_PLAN_TYPE),
                // 0 = unlimited sentinel
                userLimit: payload.userLimit ?? PLAN_CONFIG[payload.planType ?? DEFAULT_PLAN_TYPE].userLimit ?? 0,
                status: payload.status ?? "TRIAL",
                currentPeriodEnd: payload.currentPeriodEnd,
                currentPeriodStart: payload.currentPeriodStart,
                trialEndsAt: payload.trialEndsAt,
                billingInterval: payload.billingInterval,
                lastChargedAt: payload.lastChargedAt,
                autopayEnabled: payload.autopayEnabled ?? false,
                paymentMethodAddedAt: payload.paymentMethodAddedAt,
                currency: payload.currency ?? "INR",
            },
            update: {
                billingProvider: payload.billingProvider ?? undefined,
                razorpaySubId,
                providerSubscriptionId: payload.providerSubscriptionId ?? razorpaySubId,
                providerPaymentId: payload.providerPaymentId ?? undefined,
                status: payload.status,
                currentPeriodEnd: payload.currentPeriodEnd,
                currentPeriodStart: payload.currentPeriodStart,
                trialEndsAt: payload.trialEndsAt,
                billingInterval: payload.billingInterval,
                lastChargedAt: payload.lastChargedAt,
                autopayEnabled: payload.autopayEnabled,
                paymentMethodAddedAt: payload.paymentMethodAddedAt,
                ...(payload.planType ? { planType: mapPlanTypeToDb(payload.planType) } : {}),
                userLimit: payload.userLimit,
                currency: payload.currency,
            },
        }),

    updateByProviderSubscriptionId: async (
        providerSubscriptionId: string,
        payload: {
            status?: "TRIAL" | "ACTIVE" | "PAST_DUE" | "INACTIVE" | "CANCELLED";
            currentPeriodEnd?: Date | null;
            currentPeriodStart?: Date | null;
            trialEndsAt?: Date | null;
            lastChargedAt?: Date | null;
            autopayEnabled?: boolean;
            paymentMethodAddedAt?: Date | null;
            billingProvider?: "RAZORPAY" | "STRIPE" | null;
            providerPaymentId?: string | null;
            currency?: string;
        }
    ) =>
        prisma.subscription.updateMany({
            where: { providerSubscriptionId },
            data: payload,
        }),

    updateByRazorpaySubId: async (
        razorpaySubId: string,
        payload: {
            status?: "TRIAL" | "ACTIVE" | "INACTIVE" | "CANCELLED";
            currentPeriodEnd?: Date | null;
            trialEndsAt?: Date | null;
            lastChargedAt?: Date | null;
            autopayEnabled?: boolean;
            paymentMethodAddedAt?: Date | null;
        }
    ) =>
        prisma.subscription.updateMany({
            where: { razorpaySubId },
            data: payload,
        }),
};
