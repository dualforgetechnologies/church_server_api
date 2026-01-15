import { AssignmentStatus, BranchStatus, BranchType } from '@prisma/client';
import { z } from 'zod';
import { commonPaginationQueryDto } from '../common';

export const zBranchType = z.nativeEnum(BranchType);
export const zBranchStatus = z.nativeEnum(BranchStatus);
export const zAssignmentStatus = z.nativeEnum(AssignmentStatus);

export const baseBranchFields = {
    name: z.string().min(2),
    code: z.string().min(2),
    slug: z.string().min(2),

    description: z.string().optional(),
    type: zBranchType.default(BranchType.BRANCH),

    // Contact
    email: z.string().email().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    timezone: z.string().optional(),
};

export const createBranchDto = z.object({
    ...baseBranchFields,

    parentBranchId: z.string().optional(),

    pastorId: z.string().optional(),
    isPrimary: z.boolean().default(false),

    status: zBranchStatus.default(BranchStatus.ACTIVE),

    maxCapacity: z.number().int().positive().optional(),
    seatingCapacity: z.number().int().positive().optional(),
    parkingCapacity: z.number().int().positive().optional(),
});

export const createPrimaryBranchDto = z.object({
    ...baseBranchFields,
    parentBranchId: z.string().optional(),

    type: z.literal(BranchType.MAIN),
    isPrimary: z.literal(true),

    status: z.literal(BranchStatus.ACTIVE),
});

export const createChildBranchDto = z.object({
    ...baseBranchFields,

    parentBranchId: z.string(),
    type: zBranchType.default(BranchType.BRANCH),
});

export const updateBranchDto = z.object({
    name: z.string().min(2).optional(),
    slug: z.string().min(2).optional(),
    description: z.string().optional(),
    parentBranchId: z.string().optional(),

    code: z.string().min(1).optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    timezone: z.string().optional(),

    pastorId: z.string().optional(),
    isPrimary: z.boolean().optional(),

    maxCapacity: z.number().int().positive().optional(),
    seatingCapacity: z.number().int().positive().optional(),
    parkingCapacity: z.number().int().positive().optional(),
});

export const updateBranchHierarchyDto = z.object({
    parentBranchId: z.string().nullable(),
    type: zBranchType.optional(),
});

export const updateBranchStatusDto = z.object({
    status: zBranchStatus,
});

export const closeBranchDto = z.object({
    status: z.literal(BranchStatus.CLOSED),
    reason: z.string().min(3),
});

export const assignUserToBranchDto = z.object({
    userId: z.string(),
    branchId: z.string(),
    isPrimary: z.boolean().default(false),
});

export const removeUserFromBranchDto = z.object({
    userId: z.string(),
});

export const branchListQueryDto = commonPaginationQueryDto.extend({
    status: zBranchStatus.optional(),
    type: zBranchType.optional(),
    parentBranchId: z.string().optional(),
    sortBy: z.string().optional(),
});

export type CreateBranchDto = z.infer<typeof createBranchDto>;
export type CreatePrimaryBranchDto = z.infer<typeof createPrimaryBranchDto>;

export type CreateChildBranchDto = z.infer<typeof createChildBranchDto>;

export type UpdateBranchDto = z.infer<typeof updateBranchDto>;

export type UpdateBranchHierarchyDto = z.infer<typeof updateBranchHierarchyDto>;

export type UpdateBranchStatusDto = z.infer<typeof updateBranchStatusDto>;

export type CloseBranchDto = z.infer<typeof closeBranchDto>;

export type AssignUserToBranchDto = z.infer<typeof assignUserToBranchDto>;
export type RemoveUserFromBranchDto = z.infer<typeof removeUserFromBranchDto>;

export type BranchListQueryDto = z.infer<typeof branchListQueryDto>;
