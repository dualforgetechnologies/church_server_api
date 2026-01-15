import { permissionController } from '@/controllers/user-management/permission.controller';
import { authJWT } from '@/middleware/auth.middleware';
import { tenantMiddleware } from '@/middleware/tenant.middleware';
import { validateBodyDto, validateQueryDto } from '@/middleware/validate-dto.middleware';
import express from 'express';

import {
    assignPermissionsToRoleDto,
    createPermissionDto,
    createUserPermissionOverrideDto,
    effectivePermissionsQueryDto,
    permissionQueryDto,
    removePermissionsFromRoleDto,
    removeUserPermissionOverrideDto,
    roleHierarchyQueryDto,
    updatePermissionDto,
    updateRolePermissionScopeDto,
    updateUserPermissionOverrideDto,
} from '@/DTOs/roles/role.dto';
import { roleBasedMiddleware } from '@/middleware/role-base.middleware';

const permissionRouter = express.Router();

/**
 * Create a new permission
 */
permissionRouter.post(
    '/',
    authJWT.authenticate,
    roleBasedMiddleware(['SUPER_ADMIN']),
    validateBodyDto(createPermissionDto),
    permissionController.createPermission,
);

/**
 * Update a permission
 */
permissionRouter.put(
    '/:id',
    authJWT.authenticate,
    roleBasedMiddleware(['SUPER_ADMIN']),
    validateBodyDto(updatePermissionDto),
    permissionController.updatePermission,
);

/**
 * Get all permissions with optional filters
 */
permissionRouter.get(
    '/',
    authJWT.authenticate,
    validateQueryDto(permissionQueryDto),
    permissionController.getAllPermissions,
);

/**
 * Assign permissions to a role
 */
permissionRouter.post(
    '/role/assign',
    authJWT.authenticate,
    tenantMiddleware(),
    validateBodyDto(assignPermissionsToRoleDto),
    permissionController.assignPermissionsToRole,
);

/**
 * Remove permissions from a role
 */
permissionRouter.post(
    '/role/remove',
    authJWT.authenticate,
    tenantMiddleware(),
    validateBodyDto(removePermissionsFromRoleDto),
    permissionController.removePermissionsFromRole,
);

/**
 * Update role-permission scope
 */
permissionRouter.put(
    '/role/:id/scope',
    authJWT.authenticate,
    tenantMiddleware(),
    validateBodyDto(updateRolePermissionScopeDto),
    permissionController.updateRolePermissionScope,
);

/**
 * Create user permission override
 */
permissionRouter.post(
    '/user/override',
    authJWT.authenticate,
    tenantMiddleware(),
    validateBodyDto(createUserPermissionOverrideDto),
    permissionController.createUserPermissionOverride,
);

/**
 * Remove user permission override
 */
permissionRouter.post(
    '/user/override/remove',
    authJWT.authenticate,
    tenantMiddleware(),
    validateBodyDto(removeUserPermissionOverrideDto),
    permissionController.removeUserPermissionOverride,
);

permissionRouter.put(
    '/user/:userId/permission/:permissionId/override',
    authJWT.authenticate,
    tenantMiddleware(),
    validateBodyDto(updateUserPermissionOverrideDto),
    permissionController.updateUserPermissionOverride,
);

/**
 * Get effective permissions for a user
 */
permissionRouter.get(
    '/user/effective',
    authJWT.authenticate,
    validateQueryDto(effectivePermissionsQueryDto),
    permissionController.getEffectivePermissions,
);

permissionRouter.get(
    '/role/hierarchy',
    authJWT.authenticate,
    validateQueryDto(roleHierarchyQueryDto),
    permissionController.getRoleHierarchy,
);

export default permissionRouter;
