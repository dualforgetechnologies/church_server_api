import {
    Permission,
    Prisma,
    PrismaClient,
    Role,
    RolePermission,
    UserPermissionOverride,
    UserRoleAssignment,
} from '@prisma/client';
import { BaseRepository } from './base.repository';

export class PermissionRepository extends BaseRepository<
    Permission,
    Prisma.PermissionCreateInput,
    Prisma.PermissionUpdateInput,
    Prisma.PermissionWhereInput,
    Prisma.PermissionWhereUniqueInput,
    Prisma.PermissionOrderByWithRelationInput,
    Prisma.PermissionDelegate
> {
    protected model: Prisma.PermissionDelegate;

    constructor(prisma: PrismaClient) {
        super(prisma);
        this.model = prisma.permission;
    }
}

export class RoleRepository extends BaseRepository<
    Role,
    Prisma.RoleCreateInput,
    Prisma.RoleUpdateInput,
    Prisma.RoleWhereInput,
    Prisma.RoleWhereUniqueInput,
    Prisma.RoleOrderByWithRelationInput,
    Prisma.RoleDelegate
> {
    protected model: Prisma.RoleDelegate;

    constructor(prisma: PrismaClient) {
        super(prisma);
        this.model = prisma.role;
    }

    async findActiveRolesByTenant(tenantId: string) {
        return this.model.findMany({
            where: { tenantId, isActive: true },
        });
    }
}

export class RolePermissionRepository extends BaseRepository<
    RolePermission,
    Prisma.RolePermissionCreateInput,
    Prisma.RolePermissionUpdateInput,
    Prisma.RolePermissionWhereInput,
    Prisma.RolePermissionWhereUniqueInput,
    Prisma.RolePermissionOrderByWithRelationInput,
    Prisma.RolePermissionDelegate
> {
    protected model: Prisma.RolePermissionDelegate;

    constructor(prisma: PrismaClient) {
        super(prisma);
        this.model = prisma.rolePermission;
    }

    /** Example: Get all active permissions for a role */
    async findActiveByRole(roleId: string) {
        return this.model.findMany({
            where: { roleId, isActive: true },
        });
    }
}

export class UserRoleAssignmentRepository extends BaseRepository<
    UserRoleAssignment,
    Prisma.UserRoleAssignmentCreateInput,
    Prisma.UserRoleAssignmentUpdateInput,
    Prisma.UserRoleAssignmentWhereInput,
    Prisma.UserRoleAssignmentWhereUniqueInput,
    Prisma.UserRoleAssignmentOrderByWithRelationInput,
    Prisma.UserRoleAssignmentDelegate
> {
    protected model: Prisma.UserRoleAssignmentDelegate;

    constructor(prisma: PrismaClient) {
        super(prisma);
        this.model = prisma.userRoleAssignment;
    }

    async findActiveByUser(userId: string) {
        return this.model.findMany({
            where: { userId, isActive: true },
        });
    }
}

export class UserPermissionOverrideRepository extends BaseRepository<
    UserPermissionOverride,
    Prisma.UserPermissionOverrideCreateInput,
    Prisma.UserPermissionOverrideUpdateInput,
    Prisma.UserPermissionOverrideWhereInput,
    Prisma.UserPermissionOverrideWhereUniqueInput,
    Prisma.UserPermissionOverrideOrderByWithRelationInput,
    Prisma.UserPermissionOverrideDelegate
> {
    protected model: Prisma.UserPermissionOverrideDelegate;

    constructor(prisma: PrismaClient) {
        super(prisma);
        this.model = prisma.userPermissionOverride;
    }

    async findActiveByUser(userId: string) {
        return this.model.findMany({
            where: { userId, isActive: true },
        });
    }
}
