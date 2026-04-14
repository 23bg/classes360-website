import nodemailer from "nodemailer";
import { env } from "@/lib/config/env";
import { AppError } from "@/lib/utils/error";
import { logger } from "@/lib/utils/logger";
import { OtpPurpose } from "@/features/auth/constants/otpPurpose";

let transporter: nodemailer.Transporter | null = null;

const createTransporter = (secure: boolean): nodemailer.Transporter =>
    nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure,
        auth: {
            user: env.SMTP_USER,
            pass: env.SMTP_PASS,
        },
    });

const shouldRetryWithFlippedSecure = (error: unknown): boolean => {
    if (!error || typeof error !== "object") return false;
    const code = (error as { code?: unknown }).code;
    const reason = (error as { reason?: unknown }).reason;
    return code === "ESOCKET" && typeof reason === "string" && reason.toLowerCase().includes("wrong version number");
};

const resolveSecureDefault = (): boolean => {
    if (env.SMTP_PORT === 465) return true;
    return env.SMTP_SECURE;
};

const getTransporter = (): nodemailer.Transporter => {
    if (transporter) {
        return transporter;
    }

    if (!env.SMTP_HOST || !env.SMTP_PORT || !env.SMTP_USER || !env.SMTP_PASS || !env.SMTP_FROM) {
        throw new AppError(
            "SMTP is not fully configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and SMTP_FROM.",
            500,
            "SMTP_CONFIG_MISSING"
        );
    }

    transporter = createTransporter(resolveSecureDefault());

    return transporter;
};

const purposeLabel: Record<OtpPurpose, string> = {
    [OtpPurpose.VERIFY_EMAIL]: "verify your email",
    [OtpPurpose.LOGIN]: "sign in",
    [OtpPurpose.MFA]: "complete sign in",
    [OtpPurpose.RESET_PASSWORD]: "reset your password",
};

const renderOtpEmailHtml = (
  otp: string,
  expiryMinutes: number,
  purpose: OtpPurpose
): string => `
  <div style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:20px;">
      <tr>
        <td align="center">
          
          <table width="520" cellpadding="0" cellspacing="0" 
            style="background:#ffffff;border-radius:12px;padding:28px;border:1px solid #e5e7eb;">
            
            <!-- Header -->
            <tr>
              <td align="center" style="padding-bottom:16px;">
                <h2 style="margin:0;color:#111827;">Classes360</h2>
              </td>
            </tr>

            <!-- Title -->
            <tr>
              <td>
                <h3 style="margin:0 0 12px;color:#111827;">
                  Your One-Time Password (OTP)
                </h3>
              </td>
            </tr>

            <!-- Description -->
            <tr>
              <td style="color:#4b5563;font-size:14px;line-height:1.6;">
                <p style="margin:0 0 12px;">
                  Use the OTP below to <b>${purposeLabel[purpose]}</b>.
                </p>
              </td>
            </tr>

            <!-- OTP Box -->
            <tr>
              <td align="center" style="padding:20px 0;">
                <div style="
                  font-size:30px;
                  font-weight:700;
                  letter-spacing:8px;
                  padding:14px 24px;
                  background:#f1f5f9;
                  border-radius:10px;
                  color:#111827;
                  display:inline-block;
                ">
                  ${otp}
                </div>
              </td>
            </tr>

            <!-- Expiry -->
            <tr>
              <td style="color:#6b7280;font-size:13px;">
                <p style="margin:0;">
                  This OTP will expire in <b>${expiryMinutes} minutes</b>.
                </p>
              </td>
            </tr>

            <!-- Warning -->
            <tr>
              <td style="padding-top:16px;color:#9ca3af;font-size:12px;">
                <p style="margin:0;">
                  If you did not request this, you can safely ignore this email.
                </p>
              </td>
            </tr>

            <!-- Divider -->
            <tr>
              <td style="padding:20px 0;">
                <hr style="border:none;border-top:1px solid #e5e7eb;" />
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td align="center" style="font-size:12px;color:#6b7280;">
                
                <p style="margin:0 0 8px;">Stay connected</p>

                <div style="margin-bottom:12px;">
                  <a href="https://facebook.com" style="margin:0 6px;color:#2563eb;text-decoration:none;">Facebook</a>
                  <a href="https://twitter.com" style="margin:0 6px;color:#2563eb;text-decoration:none;">Twitter</a>
                  <a href="https://linkedin.com" style="margin:0 6px;color:#2563eb;text-decoration:none;">LinkedIn</a>
                  <a href="https://instagram.com" style="margin:0 6px;color:#2563eb;text-decoration:none;">Instagram</a>
                </div>

                <p style="margin:0;">
                  © ${new Date().getFullYear()} Classes360. All rights reserved.
                </p>

              </td>
            </tr>

          </table>

        </td>
      </tr>
    </table>
  </div>
`;

// const renderOtpEmailHtml = (otp: string, expiryMinutes: number, purpose: OtpPurpose): string => `
//   <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px;">
//     <h2 style="margin:0 0 12px;">Your Classes360 OTP</h2>
//         <p style="margin:0 0 16px;color:#4b5563;">Use the OTP below to ${purposeLabel[purpose]}.</p>
//     <div style="font-size:32px;font-weight:700;letter-spacing:8px;margin:16px 0;color:#111827;">${otp}</div>
//     <p style="margin:0;color:#6b7280;">This OTP expires in ${expiryMinutes} minutes.</p>
//   </div>
// `;

export const mailerService = {
    async sendOtpEmail(input: { email: string; otp: string; purpose?: OtpPurpose }): Promise<void> {
        if (!env.OTP_EMAIL_ENABLED) {
            logger.info({ email: input.email }, "OTP email sending disabled; skipping provider send");
            return;
        }

        const purpose = input.purpose ?? OtpPurpose.VERIFY_EMAIL;

        let transport = getTransporter();

        const message = {
  from: `"${env.SMTP_HOST_NAME || "Classes360"}" <${env.SMTP_FROM}>`,
  to: input.email,
  subject: `Classes360: Your verification code for ${purposeLabel[purpose]}`,
  text: `Your OTP is ${input.otp}. Use it to ${
    purposeLabel[purpose]
  }. It expires in ${env.OTP_EXPIRY_MINUTES} minutes.`,
  html: renderOtpEmailHtml(
    input.otp,
    env.OTP_EXPIRY_MINUTES,
    purpose
  ),
};

        // const message = {
        //     from: `"${env.SMTP_HOST_NAME}" <${env.SMTP_FROM}>`,
        //     // from: env.SMTP_FROM,
        //     to: input.email,
        //     subject: "Your Classes360 OTP",
        //     text: `Your OTP is ${input.otp}. Use it to ${purposeLabel[purpose]}. It expires in ${env.OTP_EXPIRY_MINUTES} minutes.`,
        //     html: renderOtpEmailHtml(input.otp, env.OTP_EXPIRY_MINUTES, purpose),
        // };

        try {
            await transport.sendMail(message);
        } catch (error) {
            if (shouldRetryWithFlippedSecure(error)) {
                const fallbackSecure = !resolveSecureDefault();
                logger.warn({ email: input.email, fallbackSecure }, "Retrying OTP email with flipped SMTP secure mode");
                try {
                    transport = createTransporter(fallbackSecure);
                    await transport.sendMail(message);
                    transporter = transport;
                    return;
                } catch (retryError) {
                    if (process.env.NODE_ENV !== "production") {
                        logger.warn(
                            { email: input.email, error: retryError },
                            "OTP email provider failed in non-production; continuing with debug OTP flow"
                        );
                        return;
                    }
                    logger.error({ error: retryError, email: input.email }, "Failed to send OTP email after retry");
                    throw new AppError("Unable to send OTP email. Please try again.", 500, "OTP_EMAIL_SEND_FAILED");
                }
            }

            if (process.env.NODE_ENV !== "production") {
                logger.warn({ error, email: input.email }, "OTP email provider failed in non-production; continuing with debug OTP flow");
                return;
            }

            logger.error({ error, email: input.email }, "Failed to send OTP email");
            throw new AppError("Unable to send OTP email. Please try again.", 500, "OTP_EMAIL_SEND_FAILED");
        }
    },

    async sendNotificationEmail(input: {
        to: string;
        subject: string;
        text: string;
        html?: string;
    }): Promise<void> {
        let transport = getTransporter();

        const message = {
            from: `"${env.SMTP_HOST_NAME}" <${env.SMTP_FROM}>`,
            to: input.to,
            subject: input.subject,
            text: input.text,
            html: input.html,
        };

        try {
            await transport.sendMail(message);
        } catch (error) {
            if (shouldRetryWithFlippedSecure(error)) {
                const fallbackSecure = !resolveSecureDefault();
                transport = createTransporter(fallbackSecure);
                await transport.sendMail(message);
                transporter = transport;
                return;
            }

            logger.error({ error, to: input.to, subject: input.subject }, "Failed to send notification email");
            throw new AppError("Unable to send notification email.", 500, "NOTIFICATION_EMAIL_SEND_FAILED");
        }
    },
};

