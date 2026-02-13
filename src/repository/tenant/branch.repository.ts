import { Branch, MemberBranchAssignment, Prisma, PrismaClient } from '@prisma/client';
import { BaseRepository } from '../base.repository';

export class BranchRepository extends BaseRepository<
    Branch,
    Prisma.BranchCreateInput,
    Prisma.BranchUpdateInput,
    Prisma.BranchWhereInput,
    Prisma.BranchWhereUniqueInput,
    Prisma.BranchOrderByWithRelationInput,
    Prisma.BranchDelegate
> {
    protected model: Prisma.BranchDelegate;

    constructor(prisma: PrismaClient) {
        super(prisma);
        this.model = prisma.branch;
    }

    async findBranchesByTenant(tenantId: string) {
        return this.model.findMany({ where: { tenantId, isDeleted: false } });
    }
}

export class MemberBranchAssignmentRepository extends BaseRepository<
    MemberBranchAssignment,
    Prisma.MemberBranchAssignmentCreateInput,
    Prisma.MemberBranchAssignmentUpdateInput,
    Prisma.MemberBranchAssignmentWhereInput,
    Prisma.MemberBranchAssignmentWhereUniqueInput,
    Prisma.MemberBranchAssignmentOrderByWithRelationInput,
    Prisma.MemberBranchAssignmentDelegate
> {
    protected model: Prisma.MemberBranchAssignmentDelegate;

    constructor(prisma: PrismaClient) {
        super(prisma);
        this.model = prisma.memberBranchAssignment;
    }

    /**
     * Find all assignments for a given branch
     * @param branchId - Branch ID
     * @returns Array of MemberBranchAssignment
     */
    async findByBranch(branchId: string): Promise<MemberBranchAssignment[]> {
        return this.model.findMany({ where: { branchId } });
    }

    /**
     * Find all assignments for a given member
     * @param memberId - Member ID
     * @returns Array of MemberBranchAssignment
     */
    async findByMember(memberId: string): Promise<MemberBranchAssignment[]> {
        return this.model.findMany({ where: { memberId } });
    }

    /**
     * Find a specific assignment by member and branch
     * @param memberId - Member ID
     * @param branchId - Branch ID
     * @returns MemberBranchAssignment or null
     */
    async findByMemberAndBranch(memberId: string, branchId: string): Promise<MemberBranchAssignment | null> {
        return this.model.findFirst({
            where: { memberId, branchId },
        });
    }

    /**
     * Remove a member from a branch by IDs
     * @param memberId - Member ID
     * @param branchId - Branch ID
     */
    async removeMemberFromBranch(memberId: string, branchId: string): Promise<void> {
        const assignment = await this.findByMemberAndBranch(memberId, branchId);
        if (!assignment) {
            return;
        }

        await this.model.delete({ where: { id: assignment.id } });
    }

    /**
     * Assign a member to a branch
     * @param data - Prisma MemberBranchAssignmentCreateInput
     * @returns Created assignment
     */
    async assignMemberToBranch(data: Prisma.MemberBranchAssignmentCreateInput): Promise<MemberBranchAssignment> {
        return this.model.create({ data });
    }
}
