import { Request, Response } from 'express';

import {
    AssignPermissionsToRoleDto,
    CreatePermissionDto,
    CreateUserPermissionOverrideDto,
    EffectivePermissionsQueryDto,
    PermissionQueryDto,
    RemovePermissionsFromRoleDto,
    RemoveUserPermissionOverrideDto,
    RoleHierarchyQueryDto,
    UpdatePermissionDto,
    UpdateRolePermissionScopeDto,
    UpdateUserPermissionOverrideDto,
} from '@/DTOs/roles/role.dto';
import Logger from '@/config/logger';
import { PermissionService } from '@/service/user/permission.service';
import { Controller } from '../controller';

export class PermissionController extends Controller {
    private readonly permissionService: PermissionService;
    private readonly logger: Logger;

    constructor() {
        super();
        this.permissionService = new PermissionService();
        this.logger = new Logger('PermissionController', 'PERMISSION_CONTROLLER');
    }

    /**
     * Create a new permission
     */
    createPermission = async (req: Request, res: Response) => {
        try {
            const payload = req.body as CreatePermissionDto;
            const actingUser = req.user;
            const result = await this.permissionService.createPermission(payload);
            return this.response(res, result);
        } catch (error) {
            return this.error({
                res,
                error,
                logger: this.logger,
                message: 'Failed to create permission',
            });
        }
    };

    /**
     * Update a permission
     */
    updatePermission = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const payload = req.body as UpdatePermissionDto;
            const actingUser = req.user;
            const result = await this.permissionService.updatePermission(id, payload, actingUser);
            return this.response(res, result);
        } catch (error) {
            return this.error({
                res,
                error,
                logger: this.logger,
                message: 'Failed to update permission',
            });
        }
    };

    /**
     * Get all permissions
     */
    getAllPermissions = async (req: Request, res: Response) => {
        try {
            const query = req.query as unknown as PermissionQueryDto;
            const result = await this.permissionService.getAllPermissions(query);
            return this.response(res, result);
        } catch (error) {
            return this.error({
                res,
                error,
                logger: this.logger,
                message: 'Failed to fetch permissions',
            });
        }
    };

    /**
     * Assign permissions to a role
     */
    assignPermissionsToRole = async (req: Request, res: Response) => {
        try {
            const payload = req.body as AssignPermissionsToRoleDto;
            const actingUser = req.user;
            const result = await this.permissionService.assignPermissionsToRole(payload, actingUser);
            return this.response(res, result);
        } catch (error) {
            return this.error({
                res,
                error,
                logger: this.logger,
                message: 'Failed to assign permissions to role',
            });
        }
    };

    /**
     * Remove permissions from a role
     */
    removePermissionsFromRole = async (req: Request, res: Response) => {
        try {
            const payload = req.body as RemovePermissionsFromRoleDto;
            const actingUser = req.user;
            const result = await this.permissionService.removePermissionsFromRole(payload, actingUser);
            return this.response(res, result);
        } catch (error) {
            return this.error({
                res,
                error,
                logger: this.logger,
                message: 'Failed to remove permissions from role',
            });
        }
    };

    /**
     * Update role-permission scope
     */
    updateRolePermissionScope = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const payload = req.body as UpdateRolePermissionScopeDto;
            const actingUser = req.user;
            const result = await this.permissionService.updateRolePermissionScope(id, payload, actingUser);
            return this.response(res, result);
        } catch (error) {
            return this.error({
                res,
                error,
                logger: this.logger,
                message: 'Failed to update role permission scope',
            });
        }
    };

    /**
     * Create user permission override
     */
    createUserPermissionOverride = async (req: Request, res: Response) => {
        try {
            const payload = req.body as CreateUserPermissionOverrideDto;
            const actingUser = req.user;
            const result = await this.permissionService.createUserPermissionOverride(payload, actingUser);
            return this.response(res, result);
        } catch (error) {
            return this.error({
                res,
                error,
                logger: this.logger,
                message: 'Failed to create user permission override',
            });
        }
    };

    /**
     * Remove user permission override
     */
    removeUserPermissionOverride = async (req: Request, res: Response) => {
        try {
            const payload = req.body as RemoveUserPermissionOverrideDto;
            const actingUser = req.user;
            const result = await this.permissionService.removeUserPermissionOverride(payload, actingUser);
            return this.response(res, result);
        } catch (error) {
            return this.error({
                res,
                error,
                logger: this.logger,
                message: 'Failed to remove user permission override',
            });
        }
    };

    /**
     * Update user permission override
     */
    updateUserPermissionOverride = async (req: Request, res: Response) => {
        try {
            const { userId, permissionId } = req.params;
            const payload = req.body as UpdateUserPermissionOverrideDto;
            const actingUser = req.user;
            const result = await this.permissionService.updateUserPermissionOverride(
                userId,
                permissionId,
                payload,
                actingUser,
            );
            return this.response(res, result);
        } catch (error) {
            return this.error({
                res,
                error,
                logger: this.logger,
                message: 'Failed to update user permission override',
            });
        }
    };

    /**
     * Get effective permissions for a user
     */
    getEffectivePermissions = async (req: Request, res: Response) => {
        try {
            const query = req.query as unknown as EffectivePermissionsQueryDto;
            const result = await this.permissionService.getEffectivePermissions(query);
            return this.response(res, result);
        } catch (error) {
            return this.error({
                res,
                error,
                logger: this.logger,
                message: 'Failed to fetch effective permissions',
            });
        }
    };

    /**
     * Get role hierarchy
     */
    getRoleHierarchy = async (req: Request, res: Response) => {
        try {
            const query = req.query as unknown as RoleHierarchyQueryDto;
            const tenantId = req.tenantId;
            const result = await this.permissionService.getRoleHierarchy(query, tenantId);
            return this.response(res, result);
        } catch (error) {
            return this.error({
                res,
                error,
                logger: this.logger,
                message: 'Failed to fetch role hierarchy',
            });
        }
    };
}

export const permissionController = new PermissionController();
