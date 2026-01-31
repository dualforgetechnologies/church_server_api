import { Prisma } from '@prisma/client';

export type CommunityWithRelations = Prisma.CommunityGetPayload<{
    include: {
        branch: true;
        tenant: true;
        creator: {
            select: {
                id: true;
                role: true;
                roleAssignments: true;
                member: true;
            };
        };
        members: {
            include: {
                member: true;
            };
        };
    };
}>;
