import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, readSessionFromCookie, setSessionCookie } from "@/lib/auth/auth";
import { canWriteInstituteData } from "@/lib/auth/permissions";
import { instituteService } from "@/features/institute/instituteApi";
import { toAppError } from "@/lib/utils/error";
import { instituteOnboardingSchema } from "@/validations/institute.validation";

export async function POST(req: NextRequest) {
    try {
        const session = await readSessionFromCookie();
        if (!session?.userId) {
            return NextResponse.json(
                { success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } },
                { status: 401 }
            );
        }

        if (!canWriteInstituteData(session.role)) {
            return NextResponse.json(
                { success: false, error: { code: "FORBIDDEN", message: "Insufficient permissions" } },
                { status: 403 }
            );
        }

        const raw = await req.json();
        const body = instituteOnboardingSchema.parse(raw);

        const institute = await instituteService.getInstitute(session.userId);
        const data = await instituteService.completeOnboarding(institute.id, body as any);

        const nextToken = createSessionToken({
            ...session,
            instituteId: institute.id,
            isOnboarded: true,
        });
        await setSessionCookie(nextToken);

        return NextResponse.json({ success: true, data });
    } catch (error) {
        const appError = toAppError(error);
        return NextResponse.json(
            { success: false, error: { code: appError.code, message: appError.message } },
            { status: appError.statusCode }
        );
    }
}

