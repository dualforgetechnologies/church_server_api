import { Prisma, User } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';

import {
    AssignRoleToUserDto,
    CreateRoleDto,
    DeleteRoleDto,
    RoleHierarchyQueryDto,
    RoleQueryDto,
    UpdateRoleDto,
    UpdateUserRoleAssignmentDto,
} from '@/DTOs/roles/role.dto';

import Logger from '@/config/logger';
import { PermissionRepository, RoleRepository, UserRoleAssignmentRepository } from '@/repository/role.repository';

import { AppResponse } from '@/types/types';
import { Service } from '../base/service.base';

export class RoleService extends Service {
    private roleRepo: RoleRepository;

    private userRoleRepo: UserRoleAssignmentRepository;
    private permissionRepo: PermissionRepository;

    constructor() {
        super(new Logger('RoleService', 'ROLE_CORE_SERVICE'));
        this.roleRepo = new RoleRepository(this.prisma);

        this.userRoleRepo = new UserRoleAssignmentRepository(this.prisma);
        this.permissionRepo = new PermissionRepository(this.prisma);
    }

    async createRole(dto: CreateRoleDto, actingUser: User, tenantId: string): Promise<AppResponse> {
        return this.run(async () => {
            const { permissionIds = [], ...data } = dto;

            return this.prisma.$transaction(async (tx) => {
                // 1. Create role
                const role = await tx.role.create({
                    data: {
                        ...data,
                        tenant: { connect: { id: tenantId } },
                        createdBy: actingUser.id,
                    },
                });

                // 2. Assign permissions (if any)
                if (permissionIds.length > 0) {
                    // Fetch only existing permissions
                    const permissions = await tx.permission.findMany({
                        where: {
                            id: { in: permissionIds },
                        },
                        select: { id: true },
                    });

                    if (permissions.length > 0) {
                        await tx.rolePermission.createMany({
                            data: permissions.map((p) => ({
                                roleId: role.id,
                                permissionId: p.id,
                                grantedBy: actingUser.id,
                                isActive: true,
                            })),
                            skipDuplicates: true,
                        });
                    }
                }

                return this.success({
                    data: role,
                    message: 'Role created successfully',
                    code: StatusCodes.CREATED,
                });
            });
        }, 'Failed to create role');
    }

    async updateRole(id: string, dto: UpdateRoleDto, actingUser: User, tenantId: string): Promise<AppResponse> {
        return this.run(async () => {
            const role = await this.roleRepo.findById({ id, tenantId });
            if (!role) {
                return this.error('Role not found', StatusCodes.NOT_FOUND);
            }

            const { permissionIds, ...rest } = dto;

            return this.prisma.$transaction(async (tx) => {
                // 1. Update role fields (if any)
                const updatedRole = await tx.role.update({
                    where: { id },
                    data: {
                        ...rest,
                        updatedBy: actingUser.id,
                    },
                });

                // 2. Sync permissions only if provided
                if (permissionIds) {
                    // Get existing role permissions
                    const existing = await tx.rolePermission.findMany({
                        where: {
                            roleId: id,
                            isActive: true,
                        },
                        select: { permissionId: true },
                    });

                    const existingIds = new Set(existing.map((p) => p.permissionId));
                    const incomingIds = new Set(permissionIds);

                    // Compute diff
                    const toAdd = permissionIds.filter((pid) => !existingIds.has(pid));
                    const toRemove = [...existingIds].filter((pid) => !incomingIds.has(pid));

                    // Validate permissions before adding
                    if (toAdd.length > 0) {
                        const validPermissions = await tx.permission.findMany({
                            where: { id: { in: toAdd } },
                            select: { id: true },
                        });

                        if (validPermissions.length > 0) {
                            await tx.rolePermission.createMany({
                                data: validPermissions.map((p) => ({
                                    roleId: id,
                                    permissionId: p.id,
                                    grantedBy: actingUser.id,
                                    isActive: true,
                                })),
                                skipDuplicates: true,
                            });
                        }
                    }

                    // Remove permissions
                    if (toRemove.length > 0) {
                        await tx.rolePermission.updateMany({
                            where: {
                                roleId: id,
                                permissionId: { in: toRemove },
                            },
                            data: {
                                isActive: false,
                            },
                        });
                    }
                }

                return this.success({
                    data: updatedRole,
                    message: 'Role updated successfully',
                });
            });
        }, 'Failed to update role');
    }

    async deleteRole(id: string, dto: DeleteRoleDto, tenantId: string): Promise<AppResponse> {
        return this.run(async () => {
            const role = await this.roleRepo.findById({ id, tenantId });
            if (!role) {
                return this.error('Role not found', StatusCodes.NOT_FOUND);
            }

            return this.prisma.$transaction(async (tx) => {
                const now = new Date();
                const deletedRole = await tx.role.update({
                    where: { id },
                    data: {
                        isDeleted: true,
                        deletedById: dto.deletedById,
                        deletedAt: now,
                    },
                });

                await tx.rolePermission.updateMany({
                    where: { roleId: id, isActive: true },
                    data: { isActive: false },
                });

                await tx.userRoleAssignment.updateMany({
                    where: { roleId: id, isActive: true },
                    data: { isActive: false },
                });

                return this.success({
                    data: deletedRole,
                    message: 'Role deleted successfully and related assignments deactivated',
                });
            });
        }, 'Failed to delete role');
    }

    async getRoles(query: RoleQueryDto, tenantId: string): Promise<AppResponse> {
        return this.run(async () => {
            const { page = 1, limit = 20, search, sortBy = 'createdAt', sortOrder = 'asc' } = query;

            const where: Prisma.RoleWhereInput = {
                isDeleted: false,
                tenantId,
                ...(search && { name: { contains: search, mode: 'insensitive' } }),
            };

            const orderBy: Prisma.Enumerable<Prisma.RoleOrderByWithRelationInput> = {
                [sortBy]: sortOrder,
            };

            const res = await this.roleRepo.findAll<Prisma.RoleInclude>(
                where,
                orderBy,
                { page, limit },
                {
                    include: {
                        permissions: {
                            include: {
                                permission: true,
                            },
                        },
                        userAssignments: true,
                    },
                },
            );
            return this.success({
                data: res.data,
                pagination: res.pagination,
                message: 'Roles retrieved successfully',
            });
        }, 'Failed to retrieve roles');
    }

    async assignRoleToUser(dto: AssignRoleToUserDto, actingUser: User): Promise<AppResponse> {
        return this.run(async () => {
            const { roleId, userId, expiresAt, ...rest } = dto;
            const assignment = await this.userRoleRepo.create({
                ...rest,
                role: {
                    connect: { id: roleId },
                },
                user: {
                    connect: { id: userId },
                },
                assignedBy: actingUser.id,

                expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
            });

            return this.success({
                data: assignment,
                message: 'Role assigned to user successfully',
            });
        }, 'Failed to assign role to user');
    }

    async unassignRoleFromUser(userId: string, roleId: string, actingUser: User): Promise<AppResponse> {
        return this.run(async () => {
            const removed = await this.userRoleRepo.delete({
                userId_roleId: {
                    userId,
                    roleId,
                },
            });

            return this.success({
                data: removed,
                message: 'Role unassigned from user successfully',
            });
        }, 'Failed to unassign role from user');
    }

    async updateUserRoleAssignment(
        userId: string,
        roleId: string,
        dto: UpdateUserRoleAssignmentDto,
        actingUser: User,
        tenantId: string,
    ): Promise<AppResponse> {
        return this.run(async () => {
            const updated = await this.userRoleRepo.update(
                {
                    userId_roleId: {
                        userId,
                        roleId,
                    },
                    user: {
                        tenantId,
                    },
                },
                {
                    ...dto,

                    expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
                    assignedBy: actingUser.id,
                },
            );

            return this.success({
                data: updated,
                message: 'User role assignment updated successfully',
            });
        }, 'Failed to update user role assignment');
    }

    async getRoleHierarchy(query: RoleHierarchyQueryDto, tenantId: string): Promise<AppResponse> {
        return this.run(async () => {
            const where: Prisma.RoleWhereInput = {
                tenantId,
                ...(query.includeInactive === false && { isActive: true }),
                ...(query.includeSystem === false && { isSystem: false }),
            };

            const roles = await this.roleRepo.findAll<Prisma.RoleInclude>(
                where,
                { hierarchyLevel: 'asc' },
                { page: 1, limit: 100 },
                {
                    include: {
                        permissions: {
                            include: {
                                permission: true,
                            },
                        },
                        userAssignments: true,
                    },
                },
            );
            return this.success({
                data: roles.data,
                message: 'Role hierarchy retrieved successfully',
            });
        }, 'Failed to retrieve role hierarchy');
    }
}
