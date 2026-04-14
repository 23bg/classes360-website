import { prisma } from "@/lib/db/prisma";
import type { SubscriptionStatus } from "@/features/auth/types/session";
import { userService } from "@/features/user/userService";

export type SessionSnapshot = {
    userId: string;
    email: string;
    role: "OWNER" | "EDITOR" | "VIEWER" | "MANAGER";
    instituteId: string;
    isOnboarded: boolean;
    subscriptionStatus: SubscriptionStatus;
    tokenVersion: number;
};

const toSessionRole = (role: "OWNER" | "EDITOR" | "VIEWER"): SessionSnapshot["role"] => {
    if (role === "OWNER" || role === "EDITOR" || role === "VIEWER") {
        return role;
    }

    return "VIEWER";
};

export const authUserRepository = {
    async getSessionSnapshot(userId: string): Promise<SessionSnapshot | null> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                role: true,
                instituteId: true,
                tokenVersion: true,
            },
        });

        if (!user || !user.email) {
            return null;
        }

        let instituteId = user.instituteId;
        if (!instituteId) {
            const assigned = await userService.assignInstituteIfMissing(user.id);
            instituteId = assigned.id;
        }

        const [institute, subscription] = await Promise.all([
            prisma.institute.findUnique({
                where: { id: instituteId },
                select: { isOnboarded: true },
            }),
            prisma.subscription.findUnique({
                where: { instituteId },
                select: { status: true },
            }),
        ]);

        return {
            userId: user.id,
            email: user.email,
            role: toSessionRole(user.role),
            instituteId,
            isOnboarded: Boolean(institute?.isOnboarded),
            subscriptionStatus: (subscription?.status ?? "TRIAL") as SubscriptionStatus,
            tokenVersion: user.tokenVersion ?? 0,
        };
    },

    async incrementTokenVersion(userId: string): Promise<void> {
        await prisma.user.updateMany({
            where: { id: userId },
            data: {
                tokenVersion: { increment: 1 },
            },
        });
    },
};
