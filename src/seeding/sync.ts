// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function asym() {
    const members = await prisma.member.findMany();

    for (const member of members) {
        if (member.branchId) {
            try {
                await prisma.memberBranchAssignment.create({
                    data: {
                        memberId: member.id,
                        branchId: member.branchId,
                    },
                });
            } catch (err) {}
        }
    }

    console.log('MemberBranchAssignmentr table seeded dynamically!');
}
