import { FeatureModule, PermissionAction, PermissionScope, UserRole } from '@prisma/client';
import { z } from 'zod';
import { commonPaginationQueryDto } from '../common';

export const idDto = z.string().cuid({ message: 'Invalid ID format' });
export const idsDto = z.array(idDto).min(1, { message: 'At least one ID is required' });

export const tenantIdDto = z.string().min(1, { message: 'Tenant ID is required' });
export const userIdDto = z.string().cuid({ message: 'Invalid user ID format' });

export const filterDto = z.object({
    isActive: z.boolean().optional(),
    isSystem: z.boolean().optional(),
    isDeleted: z.boolean().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
});

// Permission DTOs

export const createPermissionDto = z.object({
    data: z.array(
        z.object({
            module: z.nativeEnum(FeatureModule, {
                required_error: 'Module is required',
                invalid_type_error: 'Invalid module value',
            }),
            action: z.nativeEnum(PermissionAction, {
                required_error: 'Action is required',
                invalid_type_error: 'Invalid action value',
            }),
            description: z.string().max(500, 'Description cannot exceed 500 characters').optional(),
        }),
    ),
});

export const updatePermissionDto = z.object({
    module: z
        .nativeEnum(FeatureModule, {
            invalid_type_error: 'Invalid module value',
        })
        .optional(),
    action: z
        .nativeEnum(PermissionAction, {
            invalid_type_error: 'Invalid action value',
        })
        .optional(),

    description: z.string().max(500, 'Description cannot exceed 500 characters').optional(),
});

export const permissionFilterDto = filterDto.extend({
    module: z.nativeEnum(FeatureModule).optional(),
    action: z.nativeEnum(PermissionAction).optional(),
});

export const createRoleDto = z
    .object({
        name: z.string(),
        code: z.nativeEnum(UserRole, {
            required_error: 'Role code is required',
            invalid_type_error: 'Invalid role code',
        }),
        description: z.string().max(1000, 'Description cannot exceed 1000 characters').optional(),
        hierarchyLevel: z
            .number()
            .int()
            .min(0, 'Hierarchy level must be at least 0')
            .max(100, 'Hierarchy level cannot exceed 100')
            .default(0),
        isSystem: z.boolean().default(false),
        isActive: z.boolean().default(true),
        permissionIds: idsDto.optional(),
        createdBy: userIdDto.optional(),
    })
    .refine(
        (data) => {
            if (!data.isSystem && data.hierarchyLevel === 0) {
                return false;
            }
            return true;
        },
        {
            message: 'Non-system roles must have hierarchy level greater than 0',
            path: ['hierarchyLevel'],
        },
    )
    .refine((data) => data.code !== UserRole.SUPER_ADMIN, {
        message: 'SUPER_ADMIN role cannot be created',
        path: ['code'],
    });

export const updateRoleDto = z.object({
    name: z
        .string()
        .min(2, 'Role name must be at least 2 characters')
        .max(100, 'Role name cannot exceed 100 characters')
        .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Role name can only contain letters, numbers, spaces, hyphens, and underscores')
        .optional(),
    description: z.string().max(1000, 'Description cannot exceed 1000 characters').optional(),
    hierarchyLevel: z
        .number()
        .int()
        .min(0, 'Hierarchy level must be at least 0')
        .max(100, 'Hierarchy level cannot exceed 100')
        .optional(),
    isActive: z.boolean().optional(),
    isDeleted: z.boolean().optional(),
    permissionIds: idsDto.optional(),
    updatedBy: userIdDto.optional(),
});

export const deleteRoleDto = z.object({
    deletedById: userIdDto,
    deletedReason: z.string().max(500).optional(),
});

export const restoreRoleDto = z.object({
    restoredById: userIdDto,
});

export const roleFilterDto = filterDto.extend({
    code: z.nativeEnum(UserRole).optional(),
    hierarchyLevel: z.number().int().min(0).max(100).optional(),
    name: z.string().optional(),
});

export const assignPermissionsToRoleDto = z.object({
    roleId: idDto,
    permissionIds: idsDto,
    branchScope: z
        .nativeEnum(PermissionScope, {
            invalid_type_error: 'Invalid branch scope value',
        })
        .default('ALL'),
    departmentScope: z
        .nativeEnum(PermissionScope, {
            invalid_type_error: 'Invalid department scope value',
        })
        .default('ALL'),
    customConditions: z.record(z.any()).optional(),
    grantedBy: userIdDto,
    expiresAt: z
        .string()
        .datetime({ message: 'Invalid date format' })
        .optional()
        .refine(
            (date) => {
                if (!date) {
                    return true;
                }
                return new Date(date) > new Date();
            },
            { message: 'Expiry date must be in the future' },
        ),
});

export const removePermissionsFromRoleDto = z.object({
    roleId: idDto,
    permissionIds: idsDto,
    removedBy: userIdDto.optional(),
});

export const updateRolePermissionScopeDto = z.object({
    branchScope: z
        .nativeEnum(PermissionScope, {
            invalid_type_error: 'Invalid branch scope value',
        })
        .optional(),
    departmentScope: z
        .nativeEnum(PermissionScope, {
            invalid_type_error: 'Invalid department scope value',
        })
        .optional(),
    customConditions: z.record(z.any()).optional(),
    expiresAt: z
        .string()
        .datetime({ message: 'Invalid date format' })
        .optional()
        .refine(
            (date) => {
                if (!date) {
                    return true;
                }
                return new Date(date) > new Date();
            },
            { message: 'Expiry date must be in the future' },
        ),
    isActive: z.boolean().optional(),
    updatedBy: userIdDto.optional(),
});

export const bulkUpdateRolePermissionsDto = z.object({
    rolePermissionIds: idsDto,
    branchScope: z.nativeEnum(PermissionScope).optional(),
    departmentScope: z.nativeEnum(PermissionScope).optional(),
    isActive: z.boolean().optional(),
    expiresAt: z.string().datetime().optional(),
});

export const assignRoleToUserDto = z.object({
    userId: userIdDto,
    roleId: idDto,
    expiresAt: z
        .string()
        .datetime({ message: 'Invalid date format' })
        .optional()
        .refine(
            (date) => {
                if (!date) {
                    return true;
                }
                return new Date(date) > new Date();
            },
            { message: 'Expiry date must be in the future' },
        ),
    isActive: z.boolean().default(true),
});

export const unassignRoleFromUserDto = z.object({
    userId: userIdDto,
    roleId: idDto,
    unassignedBy: userIdDto.optional(),
    reason: z.string().max(500).optional(),
});

export const updateUserRoleAssignmentDto = z.object({
    expiresAt: z
        .string()
        .datetime({ message: 'Invalid date format' })
        .optional()
        .refine(
            (date) => {
                if (!date) {
                    return true;
                }
                return new Date(date) > new Date();
            },
            { message: 'Expiry date must be in the future' },
        ),
    isActive: z.boolean().optional(),
    updatedBy: userIdDto.optional(),
});

export const bulkAssignRolesDto = z.object({
    userIds: idsDto,
    roleId: idDto,
    assignedBy: userIdDto,
    expiresAt: z.string().datetime().optional(),
});

export const userRoleFilterDto = filterDto.extend({
    userId: userIdDto.optional(),
    roleId: idDto.optional(),
});

export const createUserPermissionOverrideDto = z.object({
    userId: userIdDto,
    permissionId: idDto,
    grantedBy: userIdDto,
    reason: z
        .string()
        .min(10, 'Reason must be at least 10 characters')
        .max(500, 'Reason cannot exceed 500 characters')
        .optional(),
    expiresAt: z
        .string()
        .datetime({ message: 'Invalid date format' })
        .optional()
        .refine(
            (date) => {
                if (!date) {
                    return true;
                }
                return new Date(date) > new Date();
            },
            { message: 'Expiry date must be in the future' },
        ),
    isActive: z.boolean().default(true),
});

export const updateUserPermissionOverrideDto = z.object({
    reason: z
        .string()
        .min(10, 'Reason must be at least 10 characters')
        .max(500, 'Reason cannot exceed 500 characters')
        .optional(),
    expiresAt: z
        .string()
        .datetime({ message: 'Invalid date format' })
        .optional()
        .refine(
            (date) => {
                if (!date) {
                    return true;
                }
                return new Date(date) > new Date();
            },
            { message: 'Expiry date must be in the future' },
        ),
    isActive: z.boolean().optional(),
    updatedBy: userIdDto.optional(),
});

export const bulkUserPermissionOverridesDto = z.object({
    userId: userIdDto,
    permissionIds: idsDto,
    grantedBy: userIdDto,
    reason: z.string().max(500).optional(),
    expiresAt: z.string().datetime().optional(),
});

export const removeUserPermissionOverrideDto = z.object({
    userId: userIdDto,
    permissionId: idDto,
    removedBy: userIdDto.optional(),
    reason: z.string().max(500).optional(),
});

export const permissionQueryDto = commonPaginationQueryDto.merge(permissionFilterDto);
export const roleQueryDto = commonPaginationQueryDto.merge(roleFilterDto);
export const userRoleQueryDto = commonPaginationQueryDto.merge(userRoleFilterDto);

export const effectivePermissionsQueryDto = z.object({
    userId: userIdDto,

    includeInactive: z.boolean().default(false),
    includeExpired: z.boolean().default(false),
    module: z.nativeEnum(FeatureModule).optional(),
});

export const roleHierarchyQueryDto = z.object({
    includeInactive: z.boolean().default(false),
    includeSystem: z.boolean().default(false),
});

// ============================
// Export Types
// ============================

export type IdDto = z.infer<typeof idDto>;
export type IdsDto = z.infer<typeof idsDto>;
export type TenantIdDto = z.infer<typeof tenantIdDto>;
export type UserIdDto = z.infer<typeof userIdDto>;
export type FilterDto = z.infer<typeof filterDto>;

export type CreatePermissionDto = z.infer<typeof createPermissionDto>;
export type UpdatePermissionDto = z.infer<typeof updatePermissionDto>;
export type PermissionFilterDto = z.infer<typeof permissionFilterDto>;

export type CreateRoleDto = z.infer<typeof createRoleDto>;
export type UpdateRoleDto = z.infer<typeof updateRoleDto>;
export type DeleteRoleDto = z.infer<typeof deleteRoleDto>;
export type RestoreRoleDto = z.infer<typeof restoreRoleDto>;
export type RoleFilterDto = z.infer<typeof roleFilterDto>;

export type AssignPermissionsToRoleDto = z.infer<typeof assignPermissionsToRoleDto>;
export type RemovePermissionsFromRoleDto = z.infer<typeof removePermissionsFromRoleDto>;
export type UpdateRolePermissionScopeDto = z.infer<typeof updateRolePermissionScopeDto>;
export type BulkUpdateRolePermissionsDto = z.infer<typeof bulkUpdateRolePermissionsDto>;

export type AssignRoleToUserDto = z.infer<typeof assignRoleToUserDto>;
export type UnassignRoleFromUserDto = z.infer<typeof unassignRoleFromUserDto>;
export type UpdateUserRoleAssignmentDto = z.infer<typeof updateUserRoleAssignmentDto>;
export type BulkAssignRolesDto = z.infer<typeof bulkAssignRolesDto>;
export type UserRoleFilterDto = z.infer<typeof userRoleFilterDto>;

export type CreateUserPermissionOverrideDto = z.infer<typeof createUserPermissionOverrideDto>;
export type UpdateUserPermissionOverrideDto = z.infer<typeof updateUserPermissionOverrideDto>;
export type BulkUserPermissionOverridesDto = z.infer<typeof bulkUserPermissionOverridesDto>;
export type RemoveUserPermissionOverrideDto = z.infer<typeof removeUserPermissionOverrideDto>;

export type PermissionQueryDto = z.infer<typeof permissionQueryDto>;
export type RoleQueryDto = z.infer<typeof roleQueryDto>;
export type UserRoleQueryDto = z.infer<typeof userRoleQueryDto>;
export type EffectivePermissionsQueryDto = z.infer<typeof effectivePermissionsQueryDto>;
export type RoleHierarchyQueryDto = z.infer<typeof roleHierarchyQueryDto>;
