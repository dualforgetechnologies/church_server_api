import { Community, CommunityMember, Prisma, PrismaClient } from '@prisma/client';
import { BaseRepository } from '../base.repository';

export class CommunityRepository extends BaseRepository<
    Community,
    Prisma.CommunityCreateInput,
    Prisma.CommunityUpdateInput,
    Prisma.CommunityWhereInput,
    Prisma.CommunityWhereUniqueInput,
    Prisma.CommunityOrderByWithRelationInput,
    Prisma.CommunityDelegate
> {
    protected model: Prisma.CommunityDelegate;

    constructor(prisma: PrismaClient) {
        super(prisma);
        this.model = prisma.community;
    }
}

export class CommunityMemberRepository extends BaseRepository<
    CommunityMember,
    Prisma.CommunityMemberCreateInput,
    Prisma.CommunityMemberUpdateInput,
    Prisma.CommunityMemberWhereInput,
    Prisma.CommunityMemberWhereUniqueInput,
    Prisma.CommunityMemberOrderByWithRelationInput,
    Prisma.CommunityMemberDelegate
> {
    protected model: Prisma.CommunityMemberDelegate;

    constructor(prisma: PrismaClient) {
        super(prisma);
        this.model = prisma.communityMember;
    }
}
