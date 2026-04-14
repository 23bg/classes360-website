import { describe, it, expect, vi } from "vitest";
import { wrapPrisma } from "@/lib/db/prismaErrorMapper";
import { AppError } from "@/lib/utils/error";

describe("concurrent updates", () => {
    it("one of two concurrent updates fails with SLUG_ALREADY_EXISTS", async () => {
        const mockUpdate = vi.fn()
            .mockResolvedValueOnce({ id: "i1", slug: "new-slug" })
            .mockRejectedValueOnce({ code: "P2002", meta: { target: ["slug"] } });

        const p1 = wrapPrisma(() => mockUpdate());
        const p2 = wrapPrisma(() => mockUpdate());

        const results = await Promise.allSettled([p1, p2]);

        const ok = results.filter((r) => r.status === "fulfilled");
        const failed = results.filter((r) => r.status === "rejected");

        expect(ok.length).toBe(1);
        expect(failed.length).toBe(1);

        const rej = failed[0] as PromiseRejectedResult;
        expect(rej.reason).toBeInstanceOf(AppError);
        expect((rej.reason as AppError).code).toBe("SLUG_ALREADY_EXISTS");
    });
});
