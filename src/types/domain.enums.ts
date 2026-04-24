export enum AdminRole {
    SUPERADMIN = 'SUPERADMIN',
    SUPPORT = 'SUPPORT',
}

export enum PaymentStatus {
    PENDING = 'pending',
    PROCESSING = 'processing',
    COMPLETED = 'completed',
    FAILED = 'failed',
    CANCELLED = 'cancelled',
    REFUNDED = 'refunded',
}

export enum UserStatus {
    ACTIVE = 'ACTIVE',
    BLOCKED = 'BLOCKED',
    PENDING = 'PENDING',
}

export enum BusinessRole {
    OWNER = 'OWNER',
    MANAGER = 'MANAGER',
}

export interface BusinessRoleAssignment {
    businessId: string;
    role: BusinessRole;
    assignedAt?: Date;
}
