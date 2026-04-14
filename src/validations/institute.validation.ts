import { z } from "zod";

export const instituteValidation = z.object({
    name: z.string().min(2),
    slug: z.string().min(2),
    phone: z.string().optional(),
    address: z
        .object({
            addressLine1: z.string().optional(),
            addressLine2: z.string().optional(),
            city: z.string().optional(),
            state: z.string().optional(),
            region: z.string().optional(),
            postalCode: z.string().optional(),
            country: z.string().optional(),
            countryCode: z.string().optional(),
        })
        .optional(),
    websiteUrl: z.string().url().optional(),
    instagramUrl: z.string().url().optional(),
    facebookUrl: z.string().url().optional(),
    youtubeUrl: z.string().url().optional(),
});

export const instituteUpdateSchema = z
    .object({
        name: z.string().trim().min(2).max(80).optional(),
        slug: z.string().trim().min(2).max(80).optional(),
        description: z.string().trim().max(1024).optional(),
        phone: z.string().trim().max(20).optional(),
        whatsapp: z.string().trim().max(20).optional(),
        address: z.union([
            z.string().max(1024),
            z
                .object({
                    addressLine1: z.string().max(240).optional(),
                    addressLine2: z.string().max(240).optional(),
                    city: z.string().max(60).optional(),
                    state: z.string().max(60).optional(),
                    region: z.string().max(60).optional(),
                    postalCode: z.string().max(12).optional(),
                    country: z.string().max(60).optional(),
                    countryCode: z.string().max(8).optional(),
                })
                .optional(),
        ]),
        addressLine1: z.string().max(240).optional(),
        addressLine2: z.string().max(240).optional(),
        city: z.string().max(60).optional(),
        state: z.string().max(60).optional(),
        region: z.string().max(60).optional(),
        postalCode: z.string().max(12).optional(),
        country: z.string().max(60).optional(),
        countryCode: z.string().max(8).optional(),
        timings: z.string().max(120).optional(),
        logo: z.string().url().max(2048).optional(),
        banner: z.string().url().max(2048).optional(),
        heroImage: z.string().url().max(2048).optional(),
        googleMapLink: z.string().url().max(2048).optional(),
        socialLinks: z
            .object({
                website: z.string().url().optional(),
                instagram: z.string().url().optional(),
                facebook: z.string().url().optional(),
                youtube: z.string().url().optional(),
                linkedin: z.string().url().optional(),
            })
            .optional(),
        websiteUrl: z.string().url().optional(),
        instagramUrl: z.string().url().optional(),
        facebookUrl: z.string().url().optional(),
        youtubeUrl: z.string().url().optional(),
        linkedinUrl: z.string().url().optional(),
        primaryColor: z.string().regex(/^#([0-9a-fA-F]{6})$/).optional(),
        customDomain: z.string().trim().toLowerCase().regex(/^[a-z0-9.-]+\.[a-z]{2,}$/).optional(),
    })
    .partial()
    .refine(() => true);

export const instituteOnboardingSchema = z.object({
    name: z.string().trim().min(2).max(80),
    phone: z.string().trim().min(4).max(20),
    address: z.union([
        z.string().max(1024),
        z.object({
            addressLine1: z.string().min(2).max(240),
            addressLine2: z.string().max(240).optional(),
            city: z.string().min(2).max(60),
            state: z.string().min(2).max(60),
            region: z.string().max(60).optional(),
            postalCode: z.string().max(12).optional(),
            country: z.string().max(60).optional(),
            countryCode: z.string().max(8).optional(),
        }),
    ]),
    whatsapp: z.string().trim().max(20).optional(),
    description: z.string().trim().max(1024).optional(),
    website: z.string().url().optional(),
    facebook: z.string().url().optional(),
    instagram: z.string().url().optional(),
    youtube: z.string().url().optional(),
    linkedin: z.string().url().optional(),
});
