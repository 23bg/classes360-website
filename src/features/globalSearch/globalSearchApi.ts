import { API } from "@/constants/api";
import { apiFetch } from "@/lib/api/client";

export type SearchLead = {
    id: string;
    name: string;
    phone?: string | null;
    status?: string | null;
};

export type SearchStudent = {
    id: string;
    name: string;
    phone?: string | null;
};

export type SearchCourse = {
    id: string;
    name: string;
    duration?: string | null;
};

export type SearchResults = {
    leads: SearchLead[];
    students: SearchStudent[];
    courses: SearchCourse[];
};

const EMPTY_RESULTS: SearchResults = {
    leads: [],
    students: [],
    courses: [],
};

const normalizeResults = (payload: unknown): SearchResults => {
    if (!payload || typeof payload !== "object") {
        return EMPTY_RESULTS;
    }

    const data = (payload as { data?: unknown }).data ?? payload;

    if (!data || typeof data !== "object") {
        return EMPTY_RESULTS;
    }

    const result = data as Partial<SearchResults>;

    return {
        leads: Array.isArray(result.leads) ? result.leads : [],
        students: Array.isArray(result.students) ? result.students : [],
        courses: Array.isArray(result.courses) ? result.courses : [],
    };
};

export async function getGlobalSearchResults(query: string): Promise<SearchResults> {
    const trimmed = query.trim();

    if (trimmed.length < 2) {
        return EMPTY_RESULTS;
    }

    const payload = await apiFetch<unknown>(`${API.INTERNAL.SEARCH}?q=${encodeURIComponent(trimmed)}`);
    return normalizeResults(payload);
}