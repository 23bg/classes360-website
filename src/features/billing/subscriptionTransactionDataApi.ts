import { prisma } from "@/lib/db/prisma";
import type { BillingProvider as PrismaBillingProvider } from "@prisma/client";
import { BillingProviderKey } from "./billing.types";

const mapToPrismaProvider = (p: BillingProviderKey): PrismaBillingProvider => {
  switch (p) {
    case "STRIPE":
      return "STRIPE";
    case "RAZORPAY":
      return "RAZORPAY";
    default:
      throw new Error(`Unsupported provider: ${p}`);
  }
};

export const subscriptionTransactionRepository = {
    create: async (input: {
      instituteId: string;
      userId?: string | null;
      provider: BillingProviderKey;
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
                provider: mapToPrismaProvider(input.provider),
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

    async findByProviderPaymentId(provider: BillingProviderKey, paymentId: string) {
        return prisma.subscriptionTransaction.findFirst({
            where: {
                provider: mapToPrismaProvider(provider),
                providerPaymentId: paymentId,
            },
        });
    },

    findByProviderSubscriptionId: async (provider: BillingProviderKey, providerSubscriptionId: string) =>
      prisma.subscriptionTransaction.findFirst({
        where: {
          provider: mapToPrismaProvider(provider),
          providerSubscriptionId,
        },
      }),
};
