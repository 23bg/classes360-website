export const OtpPurpose = {
	VERIFY_EMAIL: "VERIFY_EMAIL",
	LOGIN: "LOGIN",
	RESET_PASSWORD: "RESET_PASSWORD",
	MFA: "MFA",
} as const;

export type OtpPurpose = (typeof OtpPurpose)[keyof typeof OtpPurpose];

export const OTP_PURPOSE_VALUES = Object.values(OtpPurpose) as readonly OtpPurpose[];
