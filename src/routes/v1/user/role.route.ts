import { roleController } from '@/controllers/user-management/role.controller';
import { authJWT } from '@/middleware/auth.middleware';
import { tenantMiddleware } from '@/middleware/tenant.middleware';
import { validateBodyDto, validateQueryDto } from '@/middleware/validate-dto.middleware';
import express from 'express';

import {
    assignRoleToUserDto,
    createRoleDto,
    deleteRoleDto,
    roleHierarchyQueryDto,
    roleQueryDto,
    updateRoleDto,
    updateUserRoleAssignmentDto,
} from '@/DTOs/roles/role.dto';

const roleRouter = express.Router();

/**
 * Create a new role
 */
roleRouter.post(
    '/',
    authJWT.authenticate,
    tenantMiddleware(),
    validateBodyDto(createRoleDto),
    roleController.createRole,
);

/**
 * Update a role by ID
 */
roleRouter.put(
    '/:id',
    authJWT.authenticate,
    tenantMiddleware(),
    validateBodyDto(updateRoleDto),
    roleController.updateRole,
);

/**
 * Soft delete a role by ID
 */
roleRouter.delete(
    '/:id',
    authJWT.authenticate,
    tenantMiddleware(),
    validateBodyDto(deleteRoleDto),
    roleController.deleteRole,
);

/**
 * Get all roles with optional filters, pagination, and sorting
 */
roleRouter.get('/', authJWT.authenticate, validateQueryDto(roleQueryDto), roleController.getRoles);

/**
 * Assign a role to a user
 */
roleRouter.post(
    '/user/assign',
    authJWT.authenticate,
    tenantMiddleware(),
    validateBodyDto(assignRoleToUserDto),
    roleController.assignRoleToUser,
);

/**
 * Unassign a role from a user
 */
roleRouter.delete(
    '/user/:userId/role/:roleId',
    authJWT.authenticate,
    tenantMiddleware(),
    roleController.unassignRoleFromUser,
);

/**
 * Update a user-role assignment
 */
roleRouter.put(
    '/user/:userId/role/:roleId',
    authJWT.authenticate,
    tenantMiddleware(),
    validateBodyDto(updateUserRoleAssignmentDto),
    roleController.updateUserRoleAssignment,
);

/**
 * Get role hierarchy
 */
roleRouter.get(
    '/hierarchy',
    authJWT.authenticate,
    validateQueryDto(roleHierarchyQueryDto),
    roleController.getRoleHierarchy,
);

export default roleRouter;
