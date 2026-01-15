import { AssignmentStatus, DepartmentRole, DepartmentStatus, DepartmentType } from '@prisma/client';
import { z } from 'zod';
import { commonPaginationQueryDto } from '../common';

/**
 * Prisma enum mappers
 */
export const zDepartmentType = z.nativeEnum(DepartmentType);
export const zDepartmentStatus = z.nativeEnum(DepartmentStatus);
export const zDepartmentRole = z.nativeEnum(DepartmentRole);
export const zAssignmentStatus = z.nativeEnum(AssignmentStatus);

/**
 * Common department fields
 */
export const baseDepartmentFields = {
    tenantId: z.string(),
    branchId: z.string().optional(),

    name: z.string().min(2),
    code: z.string().min(2),

    description: z.string().optional(),
    type: zDepartmentType,

    headId: z.string().optional(),
};

export const createDepartmentDto = z.object({
    ...baseDepartmentFields,

    parentDepartmentId: z.string().optional(),

    status: zDepartmentStatus.default(DepartmentStatus.ACTIVE),

    maxMembers: z.number().int().positive().optional(),
    requiresTraining: z.boolean().default(false),
    isDeleted: z.boolean().default(false).optional(),
});

export const updateDepartmentDto = z.object({
    name: z.string().min(2).optional(),
    code: z.string().min(2).optional(),
    description: z.string().optional(),
    parentDepartmentId: z.string().optional(),

    status: zDepartmentStatus.optional(),
    type: zDepartmentType.optional(),
    headId: z.string().optional(),

    maxMembers: z.number().int().positive().optional(),
    requiresTraining: z.boolean().optional(),
});

export const departmentListQueryDto = commonPaginationQueryDto.extend({
    tenantId: z.string(),
    branchId: z.string().optional(),

    parentDepartmentId: z.string().optional(),

    type: zDepartmentType.optional(),
    status: zDepartmentStatus.optional(),

    search: z.string().optional(),

    page: z.number().min(1).default(1),
    limit: z.number().min(1).max(100).default(20),
});

export const departmentContextDto = z.object({
    departmentId: z.string(),
    tenantId: z.string(),
    branchId: z.string().optional(),
});

export type DepartmentContextDto = z.infer<typeof departmentContextDto>;

export type DepartmentListQueryDto = z.infer<typeof departmentListQueryDto>;

export type CreateDepartmentDto = z.infer<typeof createDepartmentDto>;
export type UpdateDepartmentDto = z.infer<typeof updateDepartmentDto>;
