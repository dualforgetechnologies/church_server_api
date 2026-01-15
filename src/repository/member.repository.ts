import { Member, Prisma, PrismaClient } from '@prisma/client';
import { BaseRepository } from './base.repository';

export class MemberRepository extends BaseRepository<
    Member,
    Prisma.MemberCreateInput,
    Prisma.MemberUpdateInput,
    Prisma.MemberWhereInput,
    Prisma.MemberWhereUniqueInput,
    Prisma.MemberOrderByWithRelationInput,
    Prisma.MemberDelegate
> {
    protected model: Prisma.MemberDelegate;

    constructor(prisma: PrismaClient) {
        super(prisma);
        this.model = prisma.member;
    }

    async findMembersByBranch(branchId: string) {
        return this.model.findMany({ where: { branchId } });
    }

    async findMembersByTenant(tenantId: string) {
        return this.model.findMany({ where: { tenantId } });
    }
}
