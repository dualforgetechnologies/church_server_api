import { Prisma, PrismaClient, User } from '@prisma/client';
import { BaseRepository } from './base.repository';

export class UserRepository extends BaseRepository<
    User,
    Prisma.UserCreateInput,
    Prisma.UserUpdateInput,
    Prisma.UserWhereInput,
    Prisma.UserWhereUniqueInput,
    Prisma.UserOrderByWithRelationInput,
    Prisma.UserDelegate
> {
    protected model: Prisma.UserDelegate;

    constructor(prisma: PrismaClient) {
        super(prisma);
        this.model = prisma.user;
    }
}
