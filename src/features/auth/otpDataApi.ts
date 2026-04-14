import crypto from "crypto";
import { prisma } from "@/lib/db/prisma";
import { requireEnv } from "@/lib/config/env";
import { userRepository } from "@/features/auth/userDataApi";
import { OtpPurpose } from "@/features/auth/constants/otpPurpose";

const MAX_VERIFY_ATTEMPTS = 5;

const hashOtp = (otp: string, purpose: OtpPurpose) =>
    crypto
        .createHash("sha256")
        .update(`${purpose}:${otp}:${requireEnv("JWT_SECRET")}`)
        .digest("hex");

const purposeSubject = (purpose: OtpPurpose) => `OTP:${purpose}`;

export const otpRepository = {
    saveOtp: async (input: {
        email: string;
        otp: string;
        purpose: OtpPurpose;
        expiresAt: Date;
        resendCount: number;
    }) => {
        const normalizedEmail = input.email.trim().toLowerCase();
        const existingUser = await userRepository.findByEmail(normalizedEmail);

        if (!existingUser) {
            return false;
        }

        const otpHash = hashOtp(input.otp, input.purpose);

        const existing = await prisma.otp.findFirst({
            where: { email: normalizedEmail, purpose: input.purpose },
        });

        if (!existing) {
            await prisma.otp.create({
                data: {
                    email: normalizedEmail,
                    purpose: input.purpose,
                    otpHash,
                    expiresAt: input.expiresAt,
                    attempts: 0,
                    resendCount: input.resendCount,
                    consumed: false,
                },
            });
        } else {
            await prisma.otp.update({
                where: { id: existing.id },
                data: {
                    otpHash,
                    expiresAt: input.expiresAt,
                    attempts: 0,
                    resendCount: input.resendCount,
                    consumed: false,
                },
            });
        }

        return true;
    },

    getLatestByEmailAndPurpose: async (email: string, purpose: OtpPurpose) => {
        const normalizedEmail = email.trim().toLowerCase();
        const record = await prisma.otp.findFirst({
            where: { email: normalizedEmail, purpose, consumed: false },
            orderBy: { createdAt: "desc" },
            select: {
                expiresAt: true,
                resendCount: true,
                consumed: true,
            },
        });

        if (!record) return null;

        return {
            otpExpiresAt: record.expiresAt,
            otpResendCount: record.resendCount,
            otpPending: !record.consumed,
            subject: purposeSubject(purpose),
        };
    },

    verifyOtp: async (email: string, otp: string, purpose: OtpPurpose) => {
        const normalizedEmail = email.trim().toLowerCase();
        const now = new Date();
        const computedHash = hashOtp(otp, purpose);

        // Try atomic match-and-mark (success path)
        const matched = await prisma.otp.updateMany({
            where: {
                email: normalizedEmail,
                purpose,
                otpHash: computedHash,
                consumed: false,
                expiresAt: { gt: now },
                attempts: { lt: MAX_VERIFY_ATTEMPTS },
            },
            data: { consumed: true },
        });

        if (matched.count > 0) return true;

        // Failure path: increment attempts for active OTP(s)
        const inc = await prisma.otp.updateMany({
            where: { email: normalizedEmail, purpose, consumed: false, expiresAt: { gt: now } },
            data: { attempts: { increment: 1 } },
        });

        if (inc.count === 0) return false;

        // If any reached the max attempts, mark them consumed
        await prisma.otp.updateMany({
            where: { email: normalizedEmail, purpose, consumed: false, attempts: { gte: MAX_VERIFY_ATTEMPTS } },
            data: { consumed: true },
        });

        return false;
    },

    consumeOtp: async (email: string, input?: { markEmailVerified?: boolean }) => {
        const normalizedEmail = email.trim().toLowerCase();

        if (input?.markEmailVerified) {
            await userRepository.updateByEmail(normalizedEmail, { emailVerified: true });
        }

        await prisma.otp.updateMany({ where: { email: normalizedEmail }, data: { consumed: true } });
    },
};

