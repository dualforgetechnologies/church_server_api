import { FeatureModule, PermissionAction, Prisma, User } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';

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
import {
    PermissionRepository,
    RolePermissionRepository,
    RoleRepository,
    UserPermissionOverrideRepository,
    UserRoleAssignmentRepository,
} from '@/repository/role.repository';

import { AppResponse } from '@/types/types';
import { Service } from '../base/service.base';

export class PermissionService extends Service {
    private permissionRepo: PermissionRepository;
    private roleRepo: RoleRepository;
    private rolePermissionRepo: RolePermissionRepository;
    private userRoleRepo: UserRoleAssignmentRepository;
    private userPermissionOverrideRepo: UserPermissionOverrideRepository;

    constructor() {
        super(new Logger('PermissionService', 'PERMISSION_CORE_SERVICE'));
        this.permissionRepo = new PermissionRepository(this.prisma);
        this.roleRepo = new RoleRepository(this.prisma);
        this.rolePermissionRepo = new RolePermissionRepository(this.prisma);
        this.userRoleRepo = new UserRoleAssignmentRepository(this.prisma);
        this.userPermissionOverrideRepo = new UserPermissionOverrideRepository(this.prisma);
    }

    async createPermission(dto: CreatePermissionDto): Promise<AppResponse> {
        return this.run(async () => {
            const result: object[] = [];

            for (const item of dto.data) {
                const exists = await this.permissionRepo.findFirst({
                    module: item.module,
                    action: item.action,
                });
                if (exists) {
                    continue;
                }

                const permission = await this.permissionRepo.create({
                    module: item.module,
                    action: item.action,
                    description: item.description,
                });

                result.push(permission);
            }

            return this.success({
                data: result,
                message: 'Permissions created successfully',
                code: StatusCodes.CREATED,
            });
        }, 'Failed to create permission');
    }

    async updatePermission(id: string, dto: UpdatePermissionDto, actingUser: User): Promise<AppResponse> {
        return this.run(async () => {
            const permission = await this.permissionRepo.findUnique({ id });
            if (!permission) {
                return this.error('Permission not found', StatusCodes.NOT_FOUND);
            }

            const updated = await this.permissionRepo.update({ id }, dto);
            return this.success({
                data: updated,
                message: 'Permission updated successfully',
            });
        }, 'Failed to update permission');
    }

    async getAllPermissions(query: PermissionQueryDto): Promise<AppResponse> {
        return this.run(async () => {
            const { page = 1, limit = 20, search, sortBy = 'createdAt', sortOrder = 'asc', module, action } = query;

            const where: Prisma.PermissionWhereInput = {
                ...(module && {
                    module,
                }),
                ...(action && {
                    action,
                }),
                ...(search && {
                    OR: [
                        { module: { equals: search as FeatureModule } },
                        { action: { equals: search as PermissionAction } },
                    ],
                }),
            };

            const orderBy: Prisma.Enumerable<Prisma.PermissionOrderByWithRelationInput> = {
                [sortBy]: sortOrder,
            };

            const res = await this.permissionRepo.findAll(where, orderBy, {
                page,
                limit,
            });
            return this.success({
                data: res.data,
                pagination: res.pagination,
                message: 'Permissions retrieved successfully',
            });
        }, 'Failed to retrieve permissions');
    }

    async assignPermissionsToRole(dto: AssignPermissionsToRoleDto, actingUser: User): Promise<AppResponse> {
        return this.run(async () => {
            const assigned: Prisma.RolePermissionCreateInput[] = dto.permissionIds.map((pid) => ({
                role: { connect: { id: dto.roleId } },
                permission: { connect: { id: pid } },
                branchScope: dto.branchScope,
                departmentScope: dto.departmentScope,
                customConditions: dto.customConditions,
                grantedBy: dto.grantedBy,
                expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
            }));

            const created = await Promise.all(assigned.map((data) => this.rolePermissionRepo.create(data)));

            return this.success({
                data: created,
                message: 'Permissions assigned to role successfully',
            });
        }, 'Failed to assign permissions to role');
    }

    async removePermissionsFromRole(dto: RemovePermissionsFromRoleDto, actingUser: User): Promise<AppResponse> {
        return this.run(async () => {
            const removed = await Promise.all(
                dto.permissionIds.map((pid) =>
                    this.rolePermissionRepo.delete({
                        roleId_permissionId: {
                            roleId: dto.roleId,
                            permissionId: pid,
                        },
                    }),
                ),
            );

            return this.success({
                data: removed,
                message: 'Permissions removed from role successfully',
            });
        }, 'Failed to remove permissions from role');
    }

    async updateRolePermissionScope(
        id: string,
        dto: UpdateRolePermissionScopeDto,
        actingUser: User,
    ): Promise<AppResponse> {
        return this.run(async () => {
            const updated = await this.rolePermissionRepo.update({ id }, dto);
            return this.success({
                data: updated,
                message: 'Role permission scope updated successfully',
            });
        }, 'Failed to update role permission scope');
    }

    // ============================
    // USER PERMISSION OVERRIDES
    // ============================

    async createUserPermissionOverride(dto: CreateUserPermissionOverrideDto, actingUser: User): Promise<AppResponse> {
        return this.run(async () => {
            const override = await this.userPermissionOverrideRepo.create({
                grantedBy: actingUser.id,
                expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
                isActive: dto.isActive ?? true,
                reason: dto.reason,
                user: { connect: { id: dto.userId } },
                permission: { connect: { id: dto.permissionId } },
            });

            return this.success({
                data: override,
                message: 'User permission override created successfully',
            });
        }, 'Failed to create user permission override');
    }
    async removeUserPermissionOverride(dto: RemoveUserPermissionOverrideDto, actingUser: User): Promise<AppResponse> {
        return this.run(async () => {
            const removed = await this.userPermissionOverrideRepo.delete({
                userId_permissionId: {
                    userId: dto.userId,
                    permissionId: dto.permissionId,
                },
            });

            return this.success({
                data: removed,
                message: 'User permission override removed successfully',
            });
        }, 'Failed to remove user permission override');
    }

    async updateUserPermissionOverride(
        userId: string,
        permissionId: string,
        dto: UpdateUserPermissionOverrideDto,
        actingUser: User,
    ): Promise<AppResponse> {
        return this.run(async () => {
            const updated = await this.userPermissionOverrideRepo.update(
                {
                    userId_permissionId: {
                        userId,
                        permissionId,
                    },
                },
                {
                    ...dto,
                    expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
                    grantedBy: dto.updatedBy ?? actingUser.id, // track who updated
                },
            );

            return this.success({
                data: updated,
                message: 'User permission override updated successfully',
            });
        }, 'Failed to update user permission override');
    }

    async getEffectivePermissions(query: EffectivePermissionsQueryDto): Promise<AppResponse> {
        return this.run(async () => {
            const userRoles = await this.userRoleRepo.findActiveByUser(query.userId);
            const roleIds = userRoles.map((r) => r.roleId);

            const rolePermissions = await this.rolePermissionRepo.getAll({
                roleId: { in: roleIds },
                isActive: true,
            });
            const userOverrides = await this.userPermissionOverrideRepo.findActiveByUser(query.userId);
            const effectivePermissions = [...rolePermissions, ...userOverrides];
            return this.success({
                data: effectivePermissions,
                message: 'Effective permissions retrieved successfully',
            });
        }, 'Failed to retrieve effective permissions');
    }

    async getRoleHierarchy(query: RoleHierarchyQueryDto, tenantId: string): Promise<AppResponse> {
        return this.run(async () => {
            const where: Prisma.RoleWhereInput = {
                tenantId,
                ...(query.includeInactive === false && { isActive: true }),
                ...(query.includeSystem === false && { isSystem: false }),
            };

            const roles = await this.roleRepo.findAll(where, { hierarchyLevel: 'asc' }, { page: 1, limit: 100 });
            return this.success({
                data: roles.data,
                message: 'Role hierarchy retrieved successfully',
            });
        }, 'Failed to retrieve role hierarchy');
    }
}
