import { jwtAuthService } from "@/features/auth/services/jwtAuthService";
import type { AccessTokenClaims, RefreshTokenClaims } from "@/features/auth/types/session";

export const refreshSession = async () => {
    const { authUserRepository } = await import("@/features/auth/services/authUserRepository");
    const refreshToken = await jwtAuthService.readRefreshTokenFromCookie();
    if (!refreshToken) {
        return null;
    }

    const refreshClaims = jwtAuthService.verifyRefreshToken(refreshToken);
    if (!refreshClaims) {
        return null;
    }

    const snapshot = await authUserRepository.getSessionSnapshot(refreshClaims.userId);
    if (!snapshot) {
        return null;
    }

    if (snapshot.tokenVersion !== refreshClaims.tokenVersion) {
        return null;
    }

    const access: AccessTokenClaims = {
        userId: snapshot.userId,
        email: snapshot.email,
        role: snapshot.role,
        instituteId: snapshot.instituteId,
        isOnboarded: snapshot.isOnboarded,
        subscriptionStatus: snapshot.subscriptionStatus,
    };

    const refresh: RefreshTokenClaims = {
        userId: snapshot.userId,
        tokenVersion: snapshot.tokenVersion,
    };

    const nextAccess = jwtAuthService.signAccessToken(access);
    const nextRefresh = jwtAuthService.signRefreshToken(refresh);

    await jwtAuthService.setAuthCookies({ accessToken: nextAccess, refreshToken: nextRefresh });

    return {
        ...access,
        tokenVersion: refresh.tokenVersion,
    };
};

export const refreshSessionUseCase = refreshSession;
