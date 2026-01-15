import { PermissionAction, PermissionScope, UserRole } from '@prisma/client';
import { z } from 'zod';
import { commonPaginationQueryDto } from '../common';

export const zPermissionScope = z.nativeEnum(PermissionScope);
export const zPermissionAction = z.nativeEnum(PermissionAction);

export const zUserRole = z.nativeEnum(UserRole);

export const basePermissionFields = {
    module: z.string().min(2),
    action: zPermissionAction,

    description: z.string().optional(),
    isSystem: z.boolean().default(true),
    isActive: z.boolean().default(true),
};

export const createPermissionDto = z.object({
    ...basePermissionFields,
});

export const updatePermissionDto = z.object({
    description: z.string().optional(),
    isActive: z.boolean().optional(),
});

export const createRoleDto = z.object({
    name: z.string().min(2),
    code: zUserRole,
    description: z.string().optional(),
    isSystem: z.boolean().default(false),
    isActive: z.boolean().default(true),
    hierarchyLevel: z.number().int().default(0),
});

export const updateRoleDto = z.object({
    name: z.string().min(2).optional(),
    description: z.string().optional(),
    isActive: z.boolean().optional(),
    hierarchyLevel: z.number().int().optional(),
});

export const deleteRoleDto = z.object({
    deletedById: z.string(),
    reason: z.string().optional(),
});

export const restoreRoleDto = z.object({
    isDeleted: z.literal(false),
});

export const assignPermissionToRoleDto = z.object({
    roleId: z.string(),
    permissionId: z.string().array(),

    branchScope: zPermissionScope.default(PermissionScope.ALL),
    departmentScope: zPermissionScope.default(PermissionScope.ALL),
    customConditions: z.record(z.any()).optional(),
    expiresAt: z.date().optional(),
});

export const updateRolePermissionDto = z.object({
    branchScope: zPermissionScope.optional(),
    departmentScope: zPermissionScope.optional(),
    customConditions: z.record(z.any()).optional(),
    expiresAt: z.date().optional(),
    isActive: z.boolean().optional(),
});

export const assignRoleToUserDto = z.object({
    userId: z.string(),
    roleId: z.string(),
    assignedBy: z.string(),
    expiresAt: z.date().optional(),
});

export const grantUserPermissionOverrideDto = z.object({
    userId: z.string(),
    permissionId: z.string().array(),
    grantedBy: z.string(),
    reason: z.string().optional(),
    expiresAt: z.date().optional(),
});

export const roleListQueryDto = commonPaginationQueryDto.extend({
    isActive: z.boolean().optional(),
    isSystem: z.boolean().optional(),
    search: z.string().optional(),
    page: z.number().min(1).default(1),
    limit: z.number().min(1).max(100).default(20),
});

export const permissionListQueryDto = commonPaginationQueryDto.extend({
    module: z.string().optional(),
    action: zPermissionAction.optional(),
    isActive: z.boolean().optional(),
});

export type PermissionListQueryDto = z.infer<typeof permissionListQueryDto>;
export type RoleListQueryDto = z.infer<typeof roleListQueryDto>;
export type GrantUserPermissionOverrideDto = z.infer<typeof grantUserPermissionOverrideDto>;
export type AssignRoleToUserDto = z.infer<typeof assignRoleToUserDto>;
export type UpdateRolePermissionDto = z.infer<typeof updateRolePermissionDto>;
export type AssignPermissionToRoleDto = z.infer<typeof assignPermissionToRoleDto>;
export type UpdateRoleDto = z.infer<typeof updateRoleDto>;
export type DeleteRoleDto = z.infer<typeof deleteRoleDto>;
export type RestoreRoleDto = z.infer<typeof restoreRoleDto>;
export type CreateRoleDto = z.infer<typeof createRoleDto>;
export type UpdatePermissionDto = z.infer<typeof updatePermissionDto>;

export type CreatePermissionDto = z.infer<typeof createPermissionDto>;
