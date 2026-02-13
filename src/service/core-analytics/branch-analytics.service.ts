import Logger from '@/config/logger';
import { BranchRepository } from '@/repository/tenant/branch.repository';
import { AppResponse } from '@/types/types';
import { PrismaClient } from '@prisma/client';
import { Service } from '../base/service.base';

/**
 * Service for managing branches within a tenant.
 */
export class BranchAnalyticsService extends Service {
    private branchRepo: BranchRepository;

    constructor(prisma: PrismaClient) {
        super(new Logger('BranchService', 'BRANCH_ANALYTICS_SERVICE'));
        this.branchRepo = new BranchRepository(prisma);
    }

    /**
     * Get core analytics for all branches
     * Includes basic info, member counts, and hierarchical relationships
     */
    async getBranchCoreAnalytics(tenantId: string): Promise<AppResponse> {
        return this.run(async () => {
            // Fetch branches and include active members
            const branches = await this.prisma.branch.findMany({
                where: { tenantId, isDeleted: false },
                include: {
                    pastor: true,
                    BranchMembers: {
                        where: { status: 'ACTIVE' },
                        select: { id: true },
                    },
                    children: {
                        select: { id: true, name: true },
                    },
                },
                orderBy: { name: 'asc' },
            });

            // Map branches into analytics structure
            const branchAnalytics = branches.map((branch) => ({
                id: branch.id,
                name: branch.name,
                code: branch.code,
                type: branch.type,
                status: branch.status,
                pastorId: branch.pastorId,
                headPastor: branch.pastor,
                memberCount: branch.BranchMembers.length,
                maxCapacity: branch.maxCapacity ?? branch.seatingCapacity ?? null,
                utilization: branch.maxCapacity
                    ? Math.round((branch.BranchMembers.length / branch.maxCapacity) * 100)
                    : null,
                childBranches: branch.children.map((child) => ({
                    id: child.id,
                    name: child.name,
                })),
            }));

            return this.success({
                data: { branches: branchAnalytics },
                message: 'Branch core analytics retrieved successfully',
            });
        }, 'Failed to retrieve branch core analytics');
    }

    async getBranchMembershipAnalytics(tenantId: string): Promise<AppResponse> {
        return this.run(async () => {
            // Group member assignments by branch
            const assignments = await this.prisma.memberBranchAssignment.groupBy({
                by: ['branchId'],
                where: {
                    status: 'ACTIVE',
                    branch: {
                        tenantId,
                        isDeleted: false,
                    },
                },
                _count: true,
            });

            // Fetch all branches for the tenant
            const branches = await this.prisma.branch.findMany({
                where: { tenantId, isDeleted: false },
                select: { id: true, name: true },
            });

            // Map branchId -> member count
            const branchMap = new Map(assignments.map((a) => [a.branchId, a._count]));

            // Combine branch info with member counts
            const enriched = branches.map((branch) => ({
                id: branch.id,
                name: branch.name,
                memberCount: branchMap.get(branch.id) ?? 0,
            }));

            // Top  branches by member count
            const topBranches = [...enriched].sort((a, b) => b.memberCount - a.memberCount);

            // Branches with no members
            const emptyBranches = enriched.filter((b) => b.memberCount === 0);

            return this.success({
                data: {
                    branches: enriched,
                    topBranches,
                    emptyBranchesCount: emptyBranches.length,
                },
                message: 'Branch membership analytics retrieved successfully',
            });
        }, 'Failed to retrieve membership analytics');
    }

    async getBranchCapacityAnalytics(tenantId: string): Promise<AppResponse> {
        return this.run(async () => {
            const branches = await this.prisma.branch.findMany({
                where: { tenantId, isDeleted: false },
                include: {
                    BranchMembers: {
                        where: { status: 'ACTIVE' },
                        select: { id: true },
                    },
                },
            });

            // Map capacity and utilization
            const enriched = branches.map((branch) => {
                const members = branch.BranchMembers.length;
                const capacity = branch.maxCapacity ?? branch.seatingCapacity ?? null;

                return {
                    id: branch.id,
                    name: branch.name,
                    members,
                    capacity,
                    utilization: capacity ? Math.round((members / capacity) * 100) : null,
                };
            });

            // Identify overloaded branches
            const overloaded = enriched.filter((b) => b.utilization && b.utilization > 100);

            return this.success({
                data: {
                    branches: enriched,
                    overloadedBranches: overloaded,
                },
                message: 'Capacity analytics retrieved successfully',
            });
        }, 'Failed to retrieve capacity analytics');
    }
}
