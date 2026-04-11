import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/v1/webhooks/razorpay/route";
import { AppError } from "@/lib/utils/error";

const { mockHandleWebhook } = vi.hoisted(() => ({
    mockHandleWebhook: vi.fn(),
}));

vi.mock("@/features/billing/providers/razorpay.provider", () => ({
    razorpayProvider: {
        handleWebhook: mockHandleWebhook,
    },
}));

describe("POST /api/v1/webhooks/razorpay", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("rejects webhook without signature", async () => {
        mockHandleWebhook.mockRejectedValueOnce(new AppError("Missing webhook signature", 400, "MISSING_SIGNATURE"));

        const request = new Request("http://localhost/api/v1/webhooks/razorpay", {
            method: "POST",
            body: JSON.stringify({ event: "subscription.activated" }),
        });

        const response = await POST(request as never);
        const body = await response.json();

        expect(response.status).toBe(400);
        expect(body.success).toBe(false);
        expect(body.error.code).toBe("MISSING_SIGNATURE");
    });

    it("rejects webhook with invalid signature", async () => {
        mockHandleWebhook.mockRejectedValueOnce(new AppError("Invalid Razorpay webhook signature", 401, "INVALID_SIGNATURE"));

        const request = new Request("http://localhost/api/v1/webhooks/razorpay", {
            method: "POST",
            headers: { "x-razorpay-signature": "invalid" },
            body: JSON.stringify({ event: "subscription.activated" }),
        });

        const response = await POST(request as never);
        const body = await response.json();

        expect(response.status).toBe(401);
        expect(body.success).toBe(false);
        expect(body.error.code).toBe("INVALID_SIGNATURE");
    });

    it("accepts valid webhook and forwards parsed data", async () => {
        mockHandleWebhook.mockResolvedValue({
            provider: "RAZORPAY",
            event: "subscription.activated",
            processed: true,
            webhookEventId: "subscription.activated:sub_123",
            providerSubscriptionId: "sub_123",
        });

        const request = new Request("http://localhost/api/v1/webhooks/razorpay", {
            method: "POST",
            headers: { "x-razorpay-signature": "valid" },
            body: JSON.stringify({ event: "subscription.activated" }),
        });

        const response = await POST(request as never);
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.success).toBe(true);
        expect(mockHandleWebhook).toHaveBeenCalled();
    });
});

