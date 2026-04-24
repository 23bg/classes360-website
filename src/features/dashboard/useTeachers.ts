import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";

const TEACHERS_QUERY_KEY = ["dashboard", "teachers"] as const;

type SaveTeacherArgs = {
    editingId: string | null;
    body: Record<string, unknown>;
};

export function useTeachers() {
    return useQuery({
        queryKey: TEACHERS_QUERY_KEY,
        queryFn: async () => {
            const response = await apiFetch<unknown>("/teachers").catch(() => []);
            return Array.isArray(response) ? response : [];
        },
        staleTime: 30_000,
    });
}

export function useSaveTeacher() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ editingId, body }: SaveTeacherArgs) => {
            const endpoint = editingId ? `/teachers/${editingId}` : "/teachers";
            const method = editingId ? "PUT" : "POST";
            return apiFetch(endpoint, { method, body: JSON.stringify(body) });
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: TEACHERS_QUERY_KEY });
        },
    });
}

export function useDeleteTeacher() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (teacherId: string) => apiFetch(`/teachers/${teacherId}`, { method: "DELETE" }),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: TEACHERS_QUERY_KEY });
        },
    });
}
