import { prisma } from "@/lib/db/prisma";
import { AppError } from "@/lib/utils/error";

type AppRole = "OWNER" | "EDITOR" | "VIEWER" | "MANAGER";

const toPrismaRole = (role?: AppRole): "OWNER" | "EDITOR" | "VIEWER" | undefined => {
    if (!role) return undefined;
    if (role === "MANAGER") return "EDITOR";
    if (role === "OWNER" || role === "EDITOR" || role === "VIEWER") return role;
    return undefined;
};

const normalizeEmail = (email: string) => email.trim().toLowerCase();

export const userService = {
    async assignInstituteIfMissing(userId: string) {
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true, instituteId: true } });
        if (!user) {
            throw new AppError("User not found", 404, "USER_NOT_FOUND");
        }

        if (user.instituteId) {
            const existingInstitute = await prisma.institute.findUnique({ where: { id: user.instituteId } });
            if (existingInstitute) return existingInstitute;
        }

        const baseSlug = (user.email?.split("@")[0] || "classes360")
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-")
            .slice(0, 30);

        const createdInstitute = await prisma.institute.create({
            data: {
                name: null,
                slug: `temp-${baseSlug || "classes360"}-${Date.now().toString(36)}`,
                isOnboarded: false,
            },
            select: { id: true },
        });

        // Conditional update to avoid overwriting a concurrently-set instituteId
        const updated = await prisma.user.updateMany({ where: { id: user.id, instituteId: null }, data: { instituteId: createdInstitute.id } });

        if (updated.count === 0) {
            // Another process likely set instituteId concurrently — re-read and return
            const refreshed = await prisma.user.findUnique({ where: { id: user.id }, select: { instituteId: true } });
            if (refreshed?.instituteId) {
                const existing = await prisma.institute.findUnique({ where: { id: refreshed.instituteId } });
                if (existing) return existing;
            }
        }

        const full = await prisma.institute.findUnique({ where: { id: createdInstitute.id } });
        if (!full) throw new AppError("Unable to create institute", 500, "INSTITUTE_CREATE_FAILED");

        return full;
    },

    async addTeamMember(
        instituteId: string,
        payload: { email: string; name?: string; role: "MANAGER" | "VIEWER" }
    ) {
        const email = normalizeEmail(payload.email);
        const name = payload.name?.trim() ?? null;
        const role = payload.role;

        return await prisma.$transaction(async (tx) => {
            const existing = await tx.user.findUnique({ where: { email } });

            if (existing?.instituteId && existing.instituteId !== instituteId) {
                throw new AppError("User already belongs to another institute", 409, "USER_ALREADY_ASSIGNED");
            }

            const willConsumeNewSeat = !existing || existing.instituteId !== instituteId;
            if (willConsumeNewSeat) {
                const subscription = await tx.subscription.findUnique({ where: { instituteId } });
                const seatLimit = subscription?.userLimit === 0 ? null : subscription?.userLimit ?? 1;
                const currentUsers = await tx.user.count({ where: { instituteId } });

                if (seatLimit !== null && currentUsers >= seatLimit) {
                    throw new AppError(
                        "Your current plan user limit is reached. Upgrade your plan to add more users.",
                        409,
                        "PLAN_USER_LIMIT_REACHED"
                    );
                }
            }

            if (existing) {
                await tx.user.updateMany({ where: { email }, data: { instituteId, role: toPrismaRole(role) ?? "OWNER", name: name ?? existing.name } });
                return tx.user.findUnique({ where: { email } });
            }

            const created = await tx.user.create({ data: { email, instituteId, role: toPrismaRole(role) ?? "OWNER", name, emailVerified: false } });
            return created;
        });
    },

    async getUserFirstLogin(userId: string) {
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { firstLogin: true } });
        return Boolean(user?.firstLogin);
    },
};

export default userService;
