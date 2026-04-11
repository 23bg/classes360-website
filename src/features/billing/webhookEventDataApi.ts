import { prisma } from "@/lib/db/prisma";

export const billingWebhookEventRepository = {
    hasProcessed: async (provider: "RAZORPAY" | "STRIPE", providerEventId: string) =>
        Boolean(
            await prisma.billingWebhookEvent.findFirst({
                where: {
                    provider,
                    providerEventId,
                },
                select: { id: true },
            })
        ),

    record: async (input: {
        provider: "RAZORPAY" | "STRIPE";
        providerEventId: string;
        eventType: string;
        instituteId?: string | null;
        providerPaymentId?: string | null;
        providerSubscriptionId?: string | null;
        payload?: Record<string, unknown> | null;
        processedAt?: Date;
    }) =>
        prisma.billingWebhookEvent.upsert({
            where: {
                provider_providerEventId: {
                    provider: input.provider,
                    providerEventId: input.providerEventId,
                },
            },
            create: {
                provider: input.provider,
                providerEventId: input.providerEventId,
                eventType: input.eventType,
                instituteId: input.instituteId ?? null,
                providerPaymentId: input.providerPaymentId ?? null,
                providerSubscriptionId: input.providerSubscriptionId ?? null,
                payload: (input.payload ?? null) as any,
                processedAt: input.processedAt ?? new Date(),
            },
            update: {
                eventType: input.eventType,
                instituteId: input.instituteId ?? null,
                providerPaymentId: input.providerPaymentId ?? null,
                providerSubscriptionId: input.providerSubscriptionId ?? null,
                payload: (input.payload ?? null) as any,
                processedAt: input.processedAt ?? new Date(),
            },
        }),
};
