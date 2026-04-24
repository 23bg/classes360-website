import { apiFetch } from "@/lib/api/client";

type PublicInstitute = {
    id: string;
    name?: string | null;
    slug?: string | null;
    phone?: string | null;
    whatsapp?: string | null;
    email?: string | null;
    description?: string | null;
    heroImage?: string | null;
    banner?: string | null;
    logo?: string | null;
    createdAt?: string;
    address?: {
        addressLine1?: string | null;
        addressLine2?: string | null;
        city?: string | null;
        state?: string | null;
    };
    courses?: unknown[];
    teachers?: unknown[];
    batches?: unknown[];
    announcements?: unknown[];
  };

const fallbackInstitute = (slug: string): PublicInstitute => ({
    id: slug,
    slug,
    name: "Institute",
    courses: [],
    teachers: [],
    batches: [],
    announcements: [],
});

export const instituteService = {
    async getPublicPage(slug: string): Promise<PublicInstitute> {
        try {
            const bySlug = await apiFetch<PublicInstitute>(`/public/${slug}`);
            return {
                ...fallbackInstitute(slug),
                ...(bySlug ?? {}),
                courses: Array.isArray(bySlug?.courses) ? bySlug.courses : [],
                teachers: Array.isArray(bySlug?.teachers) ? bySlug.teachers : [],
                batches: Array.isArray(bySlug?.batches) ? bySlug.batches : [],
                announcements: Array.isArray(bySlug?.announcements) ? bySlug.announcements : [],
            };
        } catch {
            return fallbackInstitute(slug);
        }
    },
};
