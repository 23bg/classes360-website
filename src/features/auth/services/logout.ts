import { jwtAuthService } from "@/features/auth/services/jwtAuthService";

export const logout = async () => {
    const accessToken = await jwtAuthService.readAccessTokenFromCookie();
    const access = accessToken ? jwtAuthService.verifyAccessToken(accessToken) : null;
    const refreshToken = await jwtAuthService.readRefreshTokenFromCookie();
    const refresh = refreshToken ? jwtAuthService.verifyRefreshToken(refreshToken) : null;

    await jwtAuthService.clearAuthCookies();

    const userId = access?.userId ?? refresh?.userId ?? null;

    if (userId) {
        const { authUserRepository } = await import("@/features/auth/services/authUserRepository");
        await authUserRepository.incrementTokenVersion(userId);
    }

    return { userId };
};

export const logoutUseCase = logout;
