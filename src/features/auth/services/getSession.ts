import { jwtAuthService } from "@/features/auth/services/jwtAuthService";

export const getSession = async () => {
    const accessToken = await jwtAuthService.readAccessTokenFromCookie();
    if (!accessToken) {
        return null;
    }

    return jwtAuthService.verifyAccessToken(accessToken);
};

export const getSessionUseCase = getSession;
