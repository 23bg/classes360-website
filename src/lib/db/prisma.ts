import { apiFetch } from "@/lib/api/client";

const asArray = <T>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

type GroupByResult = Array<{ instituteId: string; _count: { instituteId: number } }>;

type FindManyArgs = {
    where?: Record<string, unknown>;
    select?: Record<string, boolean>;
    take?: number;
    orderBy?: Record<string, "asc" | "desc">;
};

const fetchList = async (endpoint: string): Promise<any[]> => {
    try {
        const response = await apiFetch(endpoint);
        return asArray(response);
    } catch {
        return [];
    }
};

const applyTake = <T>(rows: T[], take?: number) => (typeof take === "number" ? rows.slice(0, take) : rows);

const groupByInstituteId = (rows: Array<{ instituteId?: string }>): GroupByResult => {
    const counts = new Map<string, number>();

    for (const row of rows) {
        if (!row.instituteId) continue;
        counts.set(row.instituteId, (counts.get(row.instituteId) ?? 0) + 1);
    }

    return Array.from(counts.entries()).map(([instituteId, count]) => ({ instituteId, _count: { instituteId: count } }));
};

export const prisma = {
    institute: {
        async findMany(args: FindManyArgs = {}) {
            const rows = await fetchList("/institute/public-list");
            return applyTake(rows, args.take);
        },
    },
    course: {
        async findMany(args: FindManyArgs = {}) {
            const rows = await fetchList("/courses");
            return applyTake(rows, args.take);
        },
        async groupBy(_args?: Record<string, unknown>) {
            const rows = await fetchList("/courses");
            return groupByInstituteId(rows);
        },
    },
    student: {
        async groupBy(_args?: Record<string, unknown>) {
            const rows = await fetchList("/students");
            return groupByInstituteId(rows);
        },
    },
    shortLink: {
        async findUnique({ where }: { where: { slug: string } }): Promise<any> {
            try {
                return await apiFetch(`/public/short-links/${encodeURIComponent(where.slug)}`);
            } catch {
                return null;
            }
        },
        async update({ where, data }: { where: { id: string }; data: Record<string, unknown> }): Promise<any> {
            return apiFetch(`/public/short-links/${encodeURIComponent(where.id)}`, {
                method: "PUT",
                body: JSON.stringify(data),
            });
        },
    },
};
