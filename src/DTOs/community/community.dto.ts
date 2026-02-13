import {
    CommunityRole,
    CommunityStatus,
    CommunityType,
    CummunityMemberStatus,
    Month,
    ProfessionType,
} from '@prisma/client';
import { z } from 'zod';
import { commonPaginationQueryDto, zodDate } from '../common';

// Enums
export const zCommunityType = z.nativeEnum(CommunityType);
export const zCommunityRole = z.nativeEnum(CommunityRole);
export const zProfessionType = z.nativeEnum(ProfessionType);
export const zCommunityMemberStatus = z.nativeEnum(CummunityMemberStatus);
export const zCommunityStatus = z.nativeEnum(CommunityStatus);
export const zMonth = z.nativeEnum(Month);

// Base fields for community
const baseCommunityFields = {
    branchId: z.string(),
    type: zCommunityType,
    status: zCommunityStatus.default(CommunityStatus.ACTIVE),
    name: z.string().min(1),
    description: z.string().optional(),
    tagline: z.string().optional(),
    leaderId: z.string().optional(),
    assistantLeaderId: z.string().optional(),
    gender: z.string().optional(),
    month: zMonth.optional(),
    profession: zProfessionType.optional(),
    location: z.string().optional(),
    country: z.string().optional(),
    contactEmail: z.string().email().optional(),
    contactPhone: z.string().optional(),
    websiteUrl: z.string().url().optional(),
    socialLinks: z.record(z.string()).optional(),
    meetingSchedule: z.record(z.any()).optional(),
    complianceNotes: z.string().optional(),
};

export const createCommunityDto = z.object({
    ...baseCommunityFields,
    membersIds: z.array(z.string()).default([]),
});

export const updateCommunityDto = z.object({
    ...baseCommunityFields,
    updatedBy: z.string().optional(),
    archivedAt: zodDate().optional(),
    deletedAt: zodDate().optional(),
});

export const communityListQueryDto = commonPaginationQueryDto.extend({
    branchId: z.string().optional(),
    memberId: z.string().optional(),
    type: zCommunityType.optional(),
    status: zCommunityStatus.optional(),
    profession: zProfessionType.optional(),
    sortBy: z.string().optional(),

    gender: z.string().optional(),
    month: zMonth.optional(),
});

// Base fields for CommunityMember
const baseCommunityMemberFields = {
    communityId: z.string(),
    membersIds: z.array(z.string()),
    role: zCommunityRole.default(CommunityRole.MEMBER),
    status: zCommunityMemberStatus.default(CummunityMemberStatus.ACTIVE),
    notes: z.string().optional(),
};

// CommunityMember DTOs
export const createCommunityMemberDto = z.object({
    ...baseCommunityMemberFields,
    joinedAt: zodDate(),
});

export const updateCommunityMemberDto = z.object({
    role: zCommunityRole.optional(),
    status: zCommunityMemberStatus.optional(),
    leftAt: zodDate().optional(),
    notes: z.string().optional(),
});

export const communityMembersListQueryDto = commonPaginationQueryDto.extend({
    memberId: z.string().optional(),
    role: zCommunityRole.optional(),
    status: zCommunityMemberStatus.optional(),
    sortBy: z.string().optional(), // e.g., "joinedAt", "role"
});

// For query parameters (optional branchId)
export const communityAnalyticsQueryDto = z.object({
    branchId: z.string().optional(),
});

// For route params (required communityId)
export const communityIdParamDto = z.object({
    communityId: z.string().min(1, 'communityId is required'),
});

export type CommunityMembersListQueryDto = z.infer<typeof communityMembersListQueryDto>;

export type CreateCommunityDto = z.infer<typeof createCommunityDto>;
export type UpdateCommunityDto = z.infer<typeof updateCommunityDto>;
export type CommunityListQueryDto = z.infer<typeof communityListQueryDto>;

export type CreateCommunityMemberDto = z.infer<typeof createCommunityMemberDto>;
export type UpdateCommunityMemberDto = z.infer<typeof updateCommunityMemberDto>;
