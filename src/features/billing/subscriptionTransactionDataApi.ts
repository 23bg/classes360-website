import { prisma } from "@/lib/db/prisma";
import type { BillingProvider } from "@prisma/client";

export const subscriptionTransactionRepository = {
    create: async (input: {
        instituteId: string;
        userId?: string | null;
        provider: BillingProvider;
        providerPaymentId?: string | null;
        providerSubscriptionId?: string | null;
        providerEventId?: string | null;
        subscriptionId?: string | null;
        planType?: string | null;
        amount: number;
        currency: string;
        status: "PENDING" | "VERIFIED" | "FAILED" | "SUCCEEDED" | "CANCELLED";
        startDate?: Date | null;
        endDate?: Date | null;
        metadata?: Record<string, unknown> | null;
    }) =>
        prisma.subscriptionTransaction.create({
            data: {
                instituteId: input.instituteId,
                userId: input.userId ?? null,
                provider: input.provider,
                providerPaymentId: input.providerPaymentId ?? null,
                providerSubscriptionId: input.providerSubscriptionId ?? null,
                providerEventId: input.providerEventId ?? null,
                subscriptionId: input.subscriptionId ?? null,
                planType: input.planType ?? null,
                amount: input.amount,
                currency: input.currency,
                status: input.status,
                startDate: input.startDate ?? null,
                endDate: input.endDate ?? null,
                metadata: (input.metadata ?? null) as any,
            },
        }),

    findByProviderPaymentId: async (provider: BillingProvider, providerPaymentId: string) =>
        prisma.subscriptionTransaction.findFirst({
            where: {
                provider,
                providerPaymentId,
            },
        }),

    findByProviderSubscriptionId: async (provider: BillingProvider, providerSubscriptionId: string) =>
        prisma.subscriptionTransaction.findFirst({
            where: {
                provider,
                providerSubscriptionId,
            },
        }),
};
