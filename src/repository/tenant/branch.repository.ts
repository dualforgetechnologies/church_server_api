import { Branch, Prisma, PrismaClient, UserBranchAssignment } from '@prisma/client';
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
        return this.model.findMany({ where: { tenantId } });
    }
}

export class UserBranchAssignmentRepository extends BaseRepository<
    UserBranchAssignment,
    Prisma.UserBranchAssignmentCreateInput,
    Prisma.UserBranchAssignmentUpdateInput,
    Prisma.UserBranchAssignmentWhereInput,
    Prisma.UserBranchAssignmentWhereUniqueInput,
    Prisma.UserBranchAssignmentOrderByWithRelationInput,
    Prisma.UserBranchAssignmentDelegate
> {
    protected model: Prisma.UserBranchAssignmentDelegate;

    constructor(prisma: PrismaClient) {
        super(prisma);
        this.model = prisma.userBranchAssignment;
    }

    /**
     * Find all assignments for a given branch
     * @param branchId - Branch ID
     * @returns Array of UserBranchAssignment
     */
    async findByBranch(branchId: string): Promise<UserBranchAssignment[]> {
        return this.model.findMany({ where: { branchId } });
    }

    /**
     * Find all assignments for a given user
     * @param userId - User ID
     * @returns Array of UserBranchAssignment
     */
    async findByUser(userId: string): Promise<UserBranchAssignment[]> {
        return this.model.findMany({ where: { userId } });
    }

    /**
     * Find a specific assignment by user and branch
     * @param userId - User ID
     * @param branchId - Branch ID
     * @returns UserBranchAssignment or null
     */
    async findByUserAndBranch(userId: string, branchId: string): Promise<UserBranchAssignment | null> {
        return this.model.findFirst({
            where: { userId, branchId },
        });
    }

    /**
     * Remove a user from a branch by IDs
     * @param userId - User ID
     * @param branchId - Branch ID
     */
    async removeUserFromBranch(userId: string, branchId: string): Promise<void> {
        const assignment = await this.findByUserAndBranch(userId, branchId);
        if (!assignment) {
            return;
        }

        await this.model.delete({ where: { id: assignment.id } });
    }

    /**
     * Assign a user to a branch
     * @param data - Prisma UserBranchAssignmentCreateInput
     * @returns Created assignment
     */
    async assignUserToBranch(data: Prisma.UserBranchAssignmentCreateInput): Promise<UserBranchAssignment> {
        return this.model.create({ data });
    }
}
