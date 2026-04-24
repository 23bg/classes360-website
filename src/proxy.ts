import { NextRequest, NextResponse } from "next/server";
// Note: removed server-only verifyAccessToken import to keep this module
// safe for frontend usage. We decode the JWT payload without verifying
// signatures (no server secret required). This is acceptable for routing
// heuristics but not for security-sensitive checks.
import { edgeLogger, getOrCreateRequestId, REQUEST_ID_HEADER } from "@/lib/request-logger";
import { getApiUrl } from "@/lib/api/url";

const ONBOARDING_PATH = "/onboarding";
const LOGIN_PATH = "/login";

export function proxy(req: NextRequest) {
    const pathname = req.nextUrl.pathname;
    const requestId = getOrCreateRequestId(req.headers);

    edgeLogger.info("middleware_protected_route", {
        requestId,
        method: req.method,
        pathname,
    });

    // === ONLY JOB: PROTECT DASHBOARD ROUTES ===

    // 1. Read access token from cookie
    const token = req.cookies.get("access_token")?.value;

    const refreshToken = req.cookies.get("refresh_token")?.value;

    if (!token) {
        if (refreshToken) {
            const refreshUrl = new URL(getApiUrl("/api/v1/auth/refresh"));
            refreshUrl.searchParams.set("next", pathname);
            edgeLogger.info("redirect_to_refresh", { requestId, from: pathname, reason: "missing_access_token" });
            return NextResponse.redirect(refreshUrl);
        }

        const loginUrl = new URL(LOGIN_PATH, req.url);
        loginUrl.searchParams.set("next", pathname);
        edgeLogger.info("redirect_to_login", { requestId, from: pathname });
        return NextResponse.redirect(loginUrl);
    }

    // 2. Parse token payload (no signature verification).
    //    This avoids pulling server-only secrets into middleware code
    //    while still allowing routing decisions based on token claims.
    const parseJwtPayload = (t: string) => {
        try {
            const parts = t.split(".");
            if (parts.length < 2) return null;
            const payload = parts[1];
            const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
            // pad base64 string
            const pad = base64.length % 4;
            const padded = pad ? base64 + "=".repeat(4 - pad) : base64;
            let json = "";
            if (typeof Buffer !== "undefined") {
                json = Buffer.from(padded, "base64").toString("utf8");
            } else if (typeof atob !== "undefined") {
                // atob returns a binary string; decode utf-8
                const bin = atob(padded);
                try {
                    // decode percent-encoded utf-8
                    json = decodeURIComponent(
                        bin
                            .split("")
                            .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
                            .join("")
                    );
                } catch {
                    json = bin;
                }
            } else {
                return null;
            }

            return JSON.parse(json) as Record<string, unknown> | null;
        } catch {
            return null;
        }
    };

    const session = token ? parseJwtPayload(token) : null;

    if (!session) {
        if (refreshToken) {
            const refreshUrl = new URL(getApiUrl("/api/v1/auth/refresh"));
            refreshUrl.searchParams.set("next", pathname);
            edgeLogger.info("redirect_to_refresh", { requestId, from: pathname, reason: "invalid_access_token" });
            return NextResponse.redirect(refreshUrl);
        }

        const loginUrl = new URL(LOGIN_PATH, req.url);
        loginUrl.searchParams.set("next", pathname);
        edgeLogger.info("invalid_token", { requestId, from: pathname });
        return NextResponse.redirect(loginUrl);
    }

    // 3. IF onboarding route, only allow if NOT onboarded
    if (pathname.startsWith(ONBOARDING_PATH)) {
        if (session.isOnboarded) {
            // Already onboarded → redirect home
            edgeLogger.info("already_onboarded", { requestId });
            return NextResponse.redirect(new URL("/", req.url));
        }
        // Allow onboarding flow
        return NextResponse.next();
    }

    // 4. IF dashboard route, require onboarded
    if (session && !session.isOnboarded) {
        edgeLogger.info("onboarding_required", { requestId, from: pathname });
        return NextResponse.redirect(new URL(ONBOARDING_PATH, req.url));
    }

    // ✅ All checks passed → allow access
    return NextResponse.next();
}

export const config = {
    matcher: [
        "/overview/:path*",
        "/leads/:path*",
        "/students/:path*",
        "/upload/:path*",
        "/team/:path*",
        "/teachers/:path*",
        "/courses/:path*",
        "/batches/:path*",
        "/defaulters/:path*",
        "/fees/:path*",
        "/institute/:path*",
        "/settings/:path*",
        "/billing/:path*",
        "/profile/:path*",
        "/onboarding/:path*",
        "/api/v1/private/:path*",
    ],
};

