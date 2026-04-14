import dns from "node:dns/promises";
import { instituteRepository } from "./instituteDataApi";
import { AppError } from "@/lib/utils/error";
import { wrapPrisma } from "@/lib/db/prismaErrorMapper";
import { logger } from "@/lib/utils/logger";

export const saveCustomDomain = async (instituteId: string, customDomain: string, surface = "portal") => {
    const normalized = (customDomain || "").trim().toLowerCase();
    if (!normalized) {
        throw new AppError("Custom domain is required", 400, "CUSTOM_DOMAIN_REQUIRED");
    }

    const existing = await instituteRepository.findByCustomDomain(normalized);
    if (existing && existing.id !== instituteId) {
        throw new AppError("Domain already in use by another institute", 409, "DOMAIN_ALREADY_IN_USE");
    }

    await wrapPrisma(() =>
        instituteRepository.updateById(instituteId, {
            customDomain: normalized,
            domainVerified: false,
            domainStatus: "PENDING",
        } as any)
    );

    await instituteRepository.upsertDomainRecord({
        instituteId,
        host: normalized,
        surface,
        status: "PENDING",
        active: false,
    });

    return {
        slug: (await instituteRepository.findById(instituteId))?.slug ?? "",
        customDomain: normalized,
        domainVerified: false,
        domainStatus: "PENDING",
        defaultDomain: "",
    };
};

export const verifyCustomDomain = async (instituteId: string, customDomain?: string) => {
    const institute = await instituteRepository.findById(instituteId);
    if (!institute) {
        throw new AppError("Institute not found", 404, "INSTITUTE_NOT_FOUND");
    }

    const targetDomain = (customDomain || institute.customDomain || "").trim().toLowerCase();
    if (!targetDomain) {
        throw new AppError("No custom domain configured", 400, "CUSTOM_DOMAIN_REQUIRED");
    }

    const cnameRecords = await dns.resolveCname(targetDomain).catch(() => [] as string[]);
    const isVerified = cnameRecords.some((record) => record.toLowerCase().includes("vercel-dns.com"));

    await wrapPrisma(() =>
        instituteRepository.updateById(instituteId, {
            customDomain: targetDomain,
            domainVerified: isVerified,
            domainStatus: isVerified ? "VERIFIED" : "FAILED",
        } as any)
    );

    await instituteRepository.upsertDomainRecord({
        instituteId,
        host: targetDomain,
        surface: "portal",
        status: isVerified ? "VERIFIED" : "FAILED",
        active: isVerified,
    });

    return {
        verified: isVerified,
        host: targetDomain,
        cnameRecords,
        nextStep: isVerified
            ? "Domain verified. Attach this domain in Vercel project settings and set status ACTIVE."
            : "DNS record not verified yet. Ensure CNAME points to cname.vercel-dns.com and retry.",
    };
};

export const activateCustomDomain = async (instituteId: string, customDomain?: string) => {
    const institute = await instituteRepository.findById(instituteId);
    if (!institute) {
        throw new AppError("Institute not found", 404, "INSTITUTE_NOT_FOUND");
    }

    const targetDomain = (customDomain || institute.customDomain || "").trim().toLowerCase();
    if (!targetDomain) {
        throw new AppError("No custom domain configured", 400, "CUSTOM_DOMAIN_REQUIRED");
    }

    if (!institute.domainVerified) {
        throw new AppError("Domain must be verified before activation", 400, "DOMAIN_NOT_VERIFIED");
    }

    await wrapPrisma(() =>
        instituteRepository.updateById(instituteId, {
            customDomain: targetDomain,
            domainStatus: "ACTIVE",
        } as any)
    );

    await instituteRepository.upsertDomainRecord({
        instituteId,
        host: targetDomain,
        surface: "portal",
        status: "ACTIVE",
        active: true,
    });

    return {
        slug: institute.slug ?? "",
        customDomain: targetDomain,
        domainVerified: true,
        domainStatus: "ACTIVE",
    };
};

export default {
    saveCustomDomain,
    verifyCustomDomain,
    activateCustomDomain,
};
