import { describe, it, expect } from "vitest";
import { mapPrismaErrorToAppError, wrapPrisma } from "@/lib/db/prismaErrorMapper";
import { AppError } from "@/lib/utils/error";

describe("prismaErrorMapper", () => {
    it("maps P2002 slug target to SLUG_ALREADY_EXISTS", () => {
        const raw = { code: "P2002", meta: { target: ["slug"] } } as unknown;
        const mapped = mapPrismaErrorToAppError(raw);
        expect(mapped).toBeInstanceOf(AppError);
        expect(mapped?.code).toBe("SLUG_ALREADY_EXISTS");
    });

    it("maps P2002 domain/host to DOMAIN_ALREADY_IN_USE", () => {
        const raw = { code: "P2002", meta: { target: ["customDomain"] } } as unknown;
        const mapped = mapPrismaErrorToAppError(raw);
        expect(mapped).toBeInstanceOf(AppError);
        expect(mapped?.code).toBe("DOMAIN_ALREADY_IN_USE");
    });

    it("wrapPrisma rethrows mapped AppError for P2002", async () => {
        const failing = async () => {
            const e: any = new Error("unique");
            e.code = "P2002";
            e.meta = { target: ["slug"] };
            throw e;
        };

        await expect(wrapPrisma(() => failing())).rejects.toHaveProperty("code", "SLUG_ALREADY_EXISTS");
    });
});
