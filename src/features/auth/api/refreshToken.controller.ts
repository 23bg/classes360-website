import { NextResponse } from "next/server";
import { refreshSession } from "@/features/auth/services/refreshSession";
import { fail, ok } from "@/features/auth/api/responses";

export const refreshTokenController = async () => {
    const session = await refreshSession();
    if (!session) {
        return NextResponse.json(fail("Invalid session"), { status: 401 });
    }

    return NextResponse.json(ok({ refreshed: true }));
};
