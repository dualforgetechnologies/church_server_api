import { Prisma, PrismaClient, Role } from '@prisma/client';
import { BaseRepository } from './base.repository';

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
}
