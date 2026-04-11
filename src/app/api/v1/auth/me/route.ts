import { NextResponse } from "next/server";
import { getSessionUseCase } from "@/features/auth/services/getSession";
import { createRouteLogger } from "@/lib/api/route-logger";
import { fail, ok } from "@/features/auth/api/responses";

export async function GET() {
    const routeLog = createRouteLogger("/api/v1/auth/me#GET");
    const session = await getSessionUseCase();

    if (!session) {
        routeLog.warn("auth_me_unauthorized");
        return NextResponse.json(fail("Not authenticated"), { status: 401 });
    }

    routeLog.info("auth_me_started", { userId: session.userId, instituteId: session.instituteId });

    const isOnboarded = Boolean(session.isOnboarded);
    routeLog.info("auth_me_succeeded", { userId: session.userId, instituteId: session.instituteId });

    return NextResponse.json(ok({
        user: {
            id: session.userId,
            email: session.email,
            role: session.role,
            emailVerified: true,
        },
        business: {
            exists: isOnboarded,
            status: isOnboarded ? ("ACTIVE" as const) : ("DRAFT" as const),
        },
        institute: {
            id: session.instituteId,
            subscriptionStatus: session.subscriptionStatus,
        },
        gbp: {
            status: "NOT_CONNECTED" as const,
        },
    }));
}


