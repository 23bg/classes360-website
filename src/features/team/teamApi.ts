import { z } from "zod";
import { userRepository } from "@/features/auth/userDataApi";
import { userService } from "@/features/user/userService";
import { AppError } from "@/lib/utils/error";
import { subscriptionService } from "@/features/subscription/subscriptionApi";
import { eventDispatcherService } from "@/lib/notifications/event-dispatcher.service";

const roleSchema = z.enum(["MANAGER", "VIEWER"]);
const memberEmailSchema = z.string().trim().max(120).email();
const memberNameSchema = z.string().trim().min(2).max(80);

export const teamService = {
    async listMembers(instituteId: string) {
        return userRepository.listByInstitute(instituteId);
    },

    async createMember(
        instituteId: string,
        actorRole: "OWNER" | "EDITOR" | "MANAGER" | "VIEWER",
        payload: { email: string; name?: string; role: "MANAGER" | "VIEWER" }
    ) {
        if (actorRole !== "OWNER") {
            throw new AppError("Only owners can add team members", 403, "FORBIDDEN");
        }

        const email = memberEmailSchema.parse(payload.email).toLowerCase();
        const name = payload.name ? memberNameSchema.parse(payload.name) : undefined;
        const role = roleSchema.parse(payload.role);

        const existing = await userRepository.findByEmail(email);

        const member = await userService.addTeamMember(instituteId, {
            email,
            name,
            role,
        });

        await eventDispatcherService.dispatch({
            event: "TEAM_MEMBER_ADDED",
            instituteId,
            message: `Team member added: ${member?.name || email} (${role}).`,
            link: "/team",
            metadata: { memberId: member?.id, role },
        });

        return member;
    },

    async updateMemberRole(
        instituteId: string,
        actorRole: "OWNER" | "EDITOR" | "MANAGER" | "VIEWER",
        actorUserId: string,
        memberId: string,
        role: "MANAGER" | "VIEWER"
    ) {
        if (actorRole !== "OWNER") {
            throw new AppError("Only owners can update team roles", 403, "FORBIDDEN");
        }

        if (memberId === actorUserId) {
            throw new AppError("Owner role cannot be changed", 400, "INVALID_OPERATION");
        }

        const nextRole = roleSchema.parse(role);
        const result = await userRepository.updateByIdAndInstitute(memberId, instituteId, { role: nextRole });

        if (result.count === 0) {
            throw new AppError("Team member not found", 404, "TEAM_MEMBER_NOT_FOUND");
        }

        await eventDispatcherService.dispatch({
            event: "TEAM_MEMBER_ROLE_UPDATED",
            instituteId,
            message: `Team member role updated to ${nextRole}.`,
            link: "/team",
            metadata: { memberId, role: nextRole },
        });

        return { updated: true };
    },

    async removeMember(
        instituteId: string,
        actorRole: "OWNER" | "EDITOR" | "MANAGER" | "VIEWER",
        actorUserId: string,
        memberId: string
    ) {
        if (actorRole !== "OWNER") {
            throw new AppError("Only owners can remove team members", 403, "FORBIDDEN");
        }

        if (memberId === actorUserId) {
            throw new AppError("Owner cannot remove self", 400, "INVALID_OPERATION");
        }

        const result = await userRepository.removeByIdAndInstitute(memberId, instituteId);
        if (result.count === 0) {
            throw new AppError("Team member not found", 404, "TEAM_MEMBER_NOT_FOUND");
        }

        await eventDispatcherService.dispatch({
            event: "TEAM_MEMBER_REMOVED",
            instituteId,
            message: "A team member has been removed.",
            link: "/team",
            metadata: { memberId },
        });

        return { deleted: true };
    },
};

