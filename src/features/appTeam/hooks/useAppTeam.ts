import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    deleteTeamMember,
    deleteTeacher,
    fetchTeamResources,
    saveTeamMember,
    saveTeacher,
} from "@/features/appTeam/appTeamApi";

const teamQueryKey = ["appTeam", "teamData"] as const;

export type TeamRow = {
    id: string;
    source: "team" | "teacher";
    role: "OWNER" | "MANAGER" | "VIEWER";
    name: string;
    phone: string;
    email: string;
    active: boolean;
    subjects?: string;
    experience?: string;
    bio?: string;
};

export type TeamData = {
    rows: TeamRow[];
    sessionRole: "OWNER" | "MANAGER" | "VIEWER";
};

export function useTeamData() {
    return useQuery<TeamData>({
        queryKey: teamQueryKey,
        queryFn: async () => {
            const { sessionRes, teamsRes, teachersRes } = await fetchTeamResources();
            const sessionRole = sessionRes?.user?.role ?? "VIEWER";

            const teamRows: TeamRow[] = (teamsRes ?? []).map((member: any) => ({
                id: member.id,
                source: "team",
                role: member.role ?? "VIEWER",
                name: member.name ?? "",
                phone: member.phone ?? "",
                email: member.email ?? "",
                active: member.active !== false,
            }));

            const teacherRows: TeamRow[] = (teachersRes ?? []).map((teacher: any) => ({
                id: teacher.id,
                source: "teacher",
                role: "VIEWER",
                name: teacher.name ?? "",
                phone: teacher.phone ?? "",
                email: teacher.email ?? "",
                active: teacher.active !== false,
                subjects: teacher.subjects ?? "",
                experience: teacher.experience ?? "",
                bio: teacher.bio ?? "",
            }));

            return {
                rows: [...teamRows, ...teacherRows],
                sessionRole,
            };
        },
        staleTime: 30_000,
    });
}

export function useSaveTeamMember() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ values, editing }: { values: Record<string, unknown>; editing: TeamRow | null }) => {
            if (editing?.source === "teacher") {
                await saveTeacher(editing.id, values);
                return;
            }

            await saveTeamMember(editing?.source === "team" ? editing.id : null, values);
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: teamQueryKey });
        },
    });
}

export function useDeleteTeamMember() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (member: TeamRow) => {
            if (member.source === "teacher") {
                await deleteTeacher(member.id);
                return;
            }

            await deleteTeamMember(member.id);
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: teamQueryKey });
        },
    });
}
