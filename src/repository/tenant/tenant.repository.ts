import { Prisma, PrismaClient, Tenant } from '@prisma/client';
import { BaseRepository } from '../base.repository';

export class TenantRepository extends BaseRepository<
    Tenant,
    Prisma.TenantCreateInput,
    Prisma.TenantUpdateInput,
    Prisma.TenantWhereInput,
    Prisma.TenantWhereUniqueInput,
    Prisma.TenantOrderByWithRelationInput,
    Prisma.TenantDelegate
> {
    protected model: Prisma.TenantDelegate;

    constructor(prisma: PrismaClient) {
        super(prisma);
        this.model = prisma.tenant;
    }
}
