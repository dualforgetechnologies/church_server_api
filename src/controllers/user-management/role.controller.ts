import { Request, Response } from 'express';

import Logger from '@/config/logger';
import { RoleService } from '@/service/user/role.service';
import { Controller } from '../controller';

import {
    AssignRoleToUserDto,
    CreateRoleDto,
    DeleteRoleDto,
    RoleHierarchyQueryDto,
    RoleQueryDto,
    UpdateRoleDto,
    UpdateUserRoleAssignmentDto,
} from '@/DTOs/roles/role.dto';

export class RoleController extends Controller {
    private readonly roleService: RoleService;
    private readonly logger: Logger;

    constructor() {
        super();
        this.roleService = new RoleService();
        this.logger = new Logger('RoleController', 'ROLE_CONTROLLER');
    }

    /**
     * Create a new role
     */
    createRole = async (req: Request, res: Response) => {
        try {
            const payload = req.body as CreateRoleDto;
            const actingUser = req.user;
            const tenantId = req.tenantId;
            const result = await this.roleService.createRole(payload, actingUser, tenantId);
            return this.response(res, result);
        } catch (error) {
            return this.error({
                res,
                error,
                logger: this.logger,
                message: 'Failed to create role',
            });
        }
    };

    /**
     * Update a role
     */
    updateRole = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const payload = req.body as UpdateRoleDto;
            const actingUser = req.user;
            const tenantId = req.tenantId;
            const result = await this.roleService.updateRole(id, payload, actingUser, tenantId);
            return this.response(res, result);
        } catch (error) {
            return this.error({
                res,
                error,
                logger: this.logger,
                message: 'Failed to update role',
            });
        }
    };

    /**
     * Soft delete a role
     */
    deleteRole = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const payload = req.body as DeleteRoleDto;
            const tenantId = req.tenantId;
            const result = await this.roleService.deleteRole(id, payload, tenantId);
            return this.response(res, result);
        } catch (error) {
            return this.error({
                res,
                error,
                logger: this.logger,
                message: 'Failed to delete role',
            });
        }
    };

    /**
     * Get all roles with filters, pagination & sorting
     */
    getRoles = async (req: Request, res: Response) => {
        try {
            const query = req.query as unknown as RoleQueryDto;
            const tenantId = req.tenantId;
            const result = await this.roleService.getRoles(query, tenantId);
            return this.response(res, result);
        } catch (error) {
            return this.error({
                res,
                error,
                logger: this.logger,
                message: 'Failed to fetch roles',
            });
        }
    };

    /**
     * Assign a role to a user
     */
    assignRoleToUser = async (req: Request, res: Response) => {
        try {
            const payload = req.body as AssignRoleToUserDto;
            const actingUser = req.user;
            const result = await this.roleService.assignRoleToUser(payload, actingUser);
            return this.response(res, result);
        } catch (error) {
            return this.error({
                res,
                error,
                logger: this.logger,
                message: 'Failed to assign role to user',
            });
        }
    };

    /**
     * Unassign a role from a user
     */
    unassignRoleFromUser = async (req: Request, res: Response) => {
        try {
            const { userId, roleId } = req.params;
            const actingUser = req.user;
            const result = await this.roleService.unassignRoleFromUser(userId, roleId, actingUser);
            return this.response(res, result);
        } catch (error) {
            return this.error({
                res,
                error,
                logger: this.logger,
                message: 'Failed to unassign role from user',
            });
        }
    };

    /**
     * Update user-role assignment
     */
    updateUserRoleAssignment = async (req: Request, res: Response) => {
        try {
            const { userId, roleId } = req.params;
            const payload = req.body as UpdateUserRoleAssignmentDto;
            const actingUser = req.user;
            const tenantId = req.tenantId;
            const result = await this.roleService.updateUserRoleAssignment(
                userId,
                roleId,
                payload,
                actingUser,
                tenantId,
            );
            return this.response(res, result);
        } catch (error) {
            return this.error({
                res,
                error,
                logger: this.logger,
                message: 'Failed to update user role assignment',
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
            const result = await this.roleService.getRoleHierarchy(query, tenantId);
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

export const roleController = new RoleController();
