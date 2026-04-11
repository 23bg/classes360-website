import { BillingProvider, BillingProviderKey } from "@/features/billing/billing.types";
import { razorpayProvider } from "@/features/billing/providers/razorpayProvider";
import { stripeProvider } from "@/features/billing/providers/stripeProvider";

const providers: Record<BillingProviderKey, BillingProvider> = {
    RAZORPAY: razorpayProvider,
    STRIPE: stripeProvider,
};

export const getBillingProvider = (provider: BillingProviderKey): BillingProvider => providers[provider];
