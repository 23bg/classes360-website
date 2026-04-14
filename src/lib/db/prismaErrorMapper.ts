import { AppError } from "@/lib/utils/error";

type PrismaErrorLike = {
    code?: string;
    meta?: { target?: string | string[] } | any;
    message?: string;
};

export const mapPrismaErrorToAppError = (error: unknown): AppError | null => {
    const e = error as PrismaErrorLike | undefined;
    if (!e) return null;

    // Unique constraint violation
    if (e.code === "P2002") {
        const target = Array.isArray(e.meta?.target) ? e.meta.target.join(",") : e.meta?.target;
        if (String(target).includes("slug")) {
            return new AppError("Slug already in use", 409, "SLUG_ALREADY_EXISTS");
        }
        if (String(target).includes("customDomain") || String(target).includes("host")) {
            return new AppError("Domain already in use by another institute", 409, "DOMAIN_ALREADY_IN_USE");
        }

        return new AppError("Duplicate value violates unique constraint", 409, "DUPLICATE_VALUE", { target });
    }

    return null;
};

export async function wrapPrisma<T>(fn: () => Promise<T>): Promise<T> {
    try {
        return await fn();
    } catch (err) {
        const mapped = mapPrismaErrorToAppError(err);
        if (mapped) throw mapped;
        throw err;
    }
}

export default mapPrismaErrorToAppError;
