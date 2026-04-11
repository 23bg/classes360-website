import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/utils/error";
import { GET, POST } from "@/app/api/v1/billing/route";

const { mockReadSessionFromCookie, mockSubscriptionService } = vi.hoisted(() => ({
    mockReadSessionFromCookie: vi.fn(),
    mockSubscriptionService: {
        getBillingDashboard: vi.fn(),
        getBillingSummary: vi.fn(),
        createCheckoutSession: vi.fn(),
        createInvoicePaymentSession: vi.fn(),
    },
}));

vi.mock("@/lib/auth/auth", () => ({
    readSessionFromCookie: mockReadSessionFromCookie,
}));

vi.mock("@/features/billing/services/billing.service", () => ({
    billingService: mockSubscriptionService,
}));

describe("/api/v1/billing", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("GET returns unauthorized without session", async () => {
        mockReadSessionFromCookie.mockResolvedValue(null);

        const response = await GET();
        const body = await response.json();

        expect(response.status).toBe(401);
        expect(body.success).toBe(false);
    });

    it("GET returns billing summary", async () => {
        mockReadSessionFromCookie.mockResolvedValue({ instituteId: "inst1" });
        mockSubscriptionService.getBillingDashboard.mockResolvedValue({
            billingContact: { name: "Inst 1", email: "owner@inst1.test" },
            institute: { id: "inst1", name: "Inst 1", country: "India", countryCode: "IN" },
            checkout: {
                provider: "RAZORPAY",
                region: "IN",
                regionLabel: "India",
                country: "India",
                recommendedProvider: "RAZORPAY",
                allowedProviders: ["RAZORPAY"],
                currency: "INR",
                taxRate: 0.18,
            },
            summary: {
            planType: "STARTER",
            status: "TRIAL",
            usersUsed: 1,
            userLimit: 1,
            trialEndsAt: new Date().toISOString(),
            },
            usage: { planType: "STARTER", alertsUsed: 0, alertsIncluded: 0, extraAlerts: 0, extraAlertRate: 0, estimatedUsageCost: 0 },
            policy: { hasOverdue: false, alertsEnabled: true, accessRestricted: false },
            sender: { mode: "CLASSES360_SHARED", connectedNumber: null, status: "DISCONNECTED" },
            invoices: [],
        });

        const response = await GET();
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.success).toBe(true);
        expect(mockSubscriptionService.getBillingDashboard).toHaveBeenCalledWith("inst1", undefined);
    });

    it("POST rejects invalid action", async () => {
        mockReadSessionFromCookie.mockResolvedValue({ instituteId: "inst1", role: "OWNER" });

        const request = new Request("http://localhost/api/v1/billing", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ action: "bad-action" }),
        });

        const response = await POST(request as never);
        const body = await response.json();

        expect(response.status).toBe(400);
        expect(body.success).toBe(false);
        expect(body.error.code).toBe("INVALID_ACTION");
    });

    it("POST rejects invalid plan", async () => {
        mockReadSessionFromCookie.mockResolvedValue({ instituteId: "inst1", role: "OWNER" });

        const request = new Request("http://localhost/api/v1/billing", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ action: "create-subscription", planType: "BASIC" }),
        });

        const response = await POST(request as never);
        const body = await response.json();

        expect(response.status).toBe(400);
        expect(body.success).toBe(false);
        expect(body.error.code).toBe("INVALID_PLAN");
    });

    it("POST creates subscription for valid action", async () => {
        mockReadSessionFromCookie.mockResolvedValue({ instituteId: "inst1", role: "OWNER" });
        mockSubscriptionService.createCheckoutSession.mockResolvedValue({
            provider: "RAZORPAY",
            region: "IN",
            checkoutMode: "subscription",
            planType: "GROWTH",
            interval: "MONTHLY",
            currency: "INR",
            amount: 1999,
            taxes: 359.82,
            totalAmount: 2358.82,
            providerSubscriptionId: "sub_123",
            checkoutSessionId: null,
            providerPaymentId: null,
            providerPaymentLinkId: null,
            checkoutUrl: null,
            clientSecret: null,
            publishableKey: "rzp_test_123",
            paymentMethods: ["CARD", "UPI", "NETBANKING"],
            redirectRequired: false,
            regionLabel: "India",
        });

        const request = new Request("http://localhost/api/v1/billing", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ action: "create-subscription", planType: "GROWTH", interval: "MONTHLY" }),
        });

        const response = await POST(request as never);
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.success).toBe(true);
        expect(mockSubscriptionService.createCheckoutSession).toHaveBeenCalledWith({
            instituteId: "inst1",
            userId: undefined,
            email: undefined,
            planType: "GROWTH",
            interval: "MONTHLY",
            provider: null,
        });
    });

    it("POST returns service failure status", async () => {
        mockReadSessionFromCookie.mockResolvedValue({ instituteId: "inst1", role: "OWNER" });
        mockSubscriptionService.createCheckoutSession.mockRejectedValue(
            new AppError("Provider down", 503, "PROVIDER_DOWN")
        );

        const request = new Request("http://localhost/api/v1/billing", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ action: "create-subscription", planType: "STARTER" }),
        });

        const response = await POST(request as never);
        const body = await response.json();

        expect(response.status).toBe(503);
        expect(body.success).toBe(false);
        expect(body.error.code).toBe("PROVIDER_DOWN");
    });
});

