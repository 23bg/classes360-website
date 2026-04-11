import { NextRequest, NextResponse } from "next/server";
import { razorpayProvider } from "@/features/billing/providers/razorpay.provider";
import { toAppError } from "@/lib/utils/error";

export async function POST(req: NextRequest) {
    try {
        const rawPayload = await req.text();
        const result = await razorpayProvider.handleWebhook({
            rawBody: rawPayload,
            headers: req.headers,
        });

        return NextResponse.json({
            success: true,
            data: result,
        });
    } catch (error) {
        const appError = toAppError(error);
        return NextResponse.json(
            {
                success: false,
                error: {
                    code: appError.code,
                    message: appError.message,
                },
            },
            { status: appError.statusCode }
        );
    }
}


