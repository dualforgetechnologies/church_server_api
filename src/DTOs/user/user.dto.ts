import { Gender, MaritalStatus, MemberStatus, MemberType, UserRole, UserStatus } from '@prisma/client';
import { z } from 'zod';
import { zodDate } from '../common';

/** ---------------------------
 * Enums
 * --------------------------- */
export const zUserRole = z.nativeEnum(UserRole);
export const zUserStatus = z.nativeEnum(UserStatus);
export const zGender = z.nativeEnum(Gender);
export const zMaritalStatus = z.nativeEnum(MaritalStatus);
export const zMemberType = z.nativeEnum(MemberType);
export const zMemberStatus = z.nativeEnum(MemberStatus);

/** ---------------------------
 * Base fields
 * --------------------------- */
export const baseUserFields = {
    email: z.string().email(),
};

export const baseMemberFields = {
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    phone: z.string().optional(),

    // Convert string to Date
    dateOfBirth: z
        .preprocess((val) => (typeof val === 'string' || val instanceof Date ? new Date(val) : val), z.coerce.date())
        .optional(),

    gender: zGender.optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    postalCode: z.string().optional(),
    profession: z.string().optional(),
    maritalStatus: zMaritalStatus.optional(),

    baptismDate: z
        .preprocess((val) => (typeof val === 'string' || val instanceof Date ? new Date(val) : val), z.coerce.date())
        .optional(),

    preferredLanguage: z.string().default('en'),
    profilePhoto: z.string().url().optional(),
    biometricId: z.string().optional(),
    privacySettings: z.record(z.any()).optional(),
    notificationSettings: z.record(z.any()).optional(),
    cellId: z.string().optional(),
    ministryId: z.string().optional(),
    departmentId: z.string().optional(),
};

export const signupUserDto = z.object({
    ...baseUserFields,
    ...baseMemberFields,
    branchId: z.string().optional(),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.literal(UserRole.MEMBER).default(UserRole.MEMBER),
    twoFactorEnabled: z.boolean().optional(),
});

// Admin creates a standard user
export const createUserDto = z.object({
    ...baseUserFields,
    ...baseMemberFields,
    branchId: z.string().optional(),
    password: z.string().min(6).optional(),
    role: zUserRole.default(UserRole.MEMBER),
    twoFactorEnabled: z.boolean().optional(),

    roleId: z.string().optional(),
    roleExpiresAt: zodDate(),
});

// Admin creates a super admin
export const createSuperAdminDto = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    role: z.literal(UserRole.SUPER_ADMIN),
    status: z.literal(UserStatus.ACTIVE).default(UserStatus.ACTIVE),
});

// Admin creates a tenant admin
export const createTenantAdminDto = z.object({
    ...baseUserFields,
    ...baseMemberFields,
    password: z.string().min(6),
    role: z.literal(UserRole.TENANT_ADMIN),
    status: zUserStatus.optional(),
    twoFactorEnabled: z.boolean().optional(),
});

// Staff user creation (specific roles)
export const createStaffUserDto = z.object({
    ...baseUserFields,
    ...baseMemberFields,
    password: z.string().min(6),
    role: z.enum([
        UserRole.PASTOR,
        UserRole.WORKER,
        UserRole.COUNSELOR,
        UserRole.DEPARTMENT_HEAD,
        UserRole.VOLUNTEER_COORDINATOR,
    ]),
    status: zUserStatus.default(UserStatus.ACTIVE),
});

// Update user (profile & account info)
export const updateUserDto = z.object({
    email: z.string().email().optional(),
    role: zUserRole.optional(),
    status: zUserStatus.optional(),
    twoFactorEnabled: z.boolean().optional(),
    ...baseMemberFields,
});

// Change password
export const changePasswordDto = z.object({
    oldPassword: z.string().min(6, 'Old password must be at least 6 characters'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

// Other status DTOs
export const updateUserStatusDto = z.object({ status: zUserStatus });
export const deactivateUserDto = z.object({ reason: z.string().min(3) });
export const reactivateUserDto = z.object({ status: z.literal(UserStatus.ACTIVE) });
export const updatePasswordDto = z.object({ oldPassword: z.string(), newPassword: z.string().min(6) });

// Login DTO
export const loginUserDto = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

/** ---------------------------
 * Types
 * --------------------------- */
export type SignupUserDto = z.infer<typeof signupUserDto>;
export type CreateUserDto = z.infer<typeof createUserDto>;
export type CreateSuperAdminDto = z.infer<typeof createSuperAdminDto>;
export type CreateTenantAdminDto = z.infer<typeof createTenantAdminDto>;
export type CreateStaffUserDto = z.infer<typeof createStaffUserDto>;
export type UpdateUserDto = z.infer<typeof updateUserDto>;
export type ChangePasswordDto = z.infer<typeof changePasswordDto>;
export type UpdatePasswordDto = z.infer<typeof updatePasswordDto>;
export type UpdateUserStatusDto = z.infer<typeof updateUserStatusDto>;
export type DeactivateUserDto = z.infer<typeof deactivateUserDto>;
export type ReactivateUserDto = z.infer<typeof reactivateUserDto>;
export type LoginUserDto = z.infer<typeof loginUserDto>;
