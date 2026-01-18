import { Gender, MaritalStatus, MemberStatus, MemberType } from '@prisma/client';
import { z } from 'zod';
import { commonPaginationQueryDto, zodDate } from '../common';

export const zGender = z.nativeEnum(Gender);
export const zMaritalStatus = z.nativeEnum(MaritalStatus);
export const zMemberType = z.nativeEnum(MemberType);
export const zMemberStatus = z.nativeEnum(MemberStatus);

export const baseMemberFields = {
    branchId: z.string().optional(),

    userId: z.string(),
    memberNumber: z.string(),

    firstName: z.string().min(1),
    lastName: z.string().min(1),

    email: z.string().email(),
    phone: z.string().optional(),
};

export const createMemberDto = z.object({
    ...baseMemberFields,

    dateOfBirth: zodDate(),
    gender: zGender.optional(),

    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    postalCode: z.string().optional(),

    profession: z.string().optional(),
    maritalStatus: zMaritalStatus.optional(),

    baptismDate: zodDate(),
    joinDate: zodDate(),

    memberType: zMemberType.default(MemberType.MEMBER),
    memberStatus: zMemberStatus.default(MemberStatus.ACTIVE),

    preferredLanguage: z.string().default('en'),
    profilePhoto: z.string().url().optional(),

    biometricId: z.string().optional(),

    privacySettings: z.record(z.any()).optional(),
    notificationSettings: z.record(z.any()).optional(),

    cellId: z.string().optional(),
    ministryId: z.string().optional(),
    departmentId: z.string().optional(),
});

export const createGuestMemberDto = z.object({
    ...baseMemberFields,

    memberType: z.literal(MemberType.GUEST),
    memberStatus: z.literal(MemberStatus.ACTIVE),

    joinDate: zodDate(),
});

export const updateMemberDto = z.object({
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    branchId: z.string().optional(),

    email: z.string().email().optional(),
    phone: z.string().optional(),

    dateOfBirth: zodDate(),
    gender: zGender.optional(),

    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    postalCode: z.string().optional(),

    profession: z.string().optional(),
    maritalStatus: zMaritalStatus.optional(),

    memberType: zMemberType.optional(),
    memberStatus: zMemberStatus.optional(),

    cellId: z.string().optional(),
    ministryId: z.string().optional(),
    departmentId: z.string().optional(),
    biometricId: z.string().optional(),

    baptismDate: zodDate(),
    preferredLanguage: z.string().optional(),
    profilePhoto: z.string().url().optional(),

    privacySettings: z.record(z.any()).optional(),
    notificationSettings: z.record(z.any()).optional(),
});

export const memberListQueryDto = commonPaginationQueryDto.extend({
    branchId: z.string().optional(),
    departmentId: z.string().optional(),

    memberType: zMemberType.optional(),
    memberStatus: zMemberStatus.optional(),
    gender: zGender.optional(),
    sortBy: z.string().optional(),
});

export type CreateMemberDto = z.infer<typeof createMemberDto>;
export type CreateGuestMemberDto = z.infer<typeof createGuestMemberDto>;
export type UpdateMemberDto = z.infer<typeof updateMemberDto>;
export type MemberListQueryDto = z.infer<typeof memberListQueryDto>;
