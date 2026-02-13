import Logger from '@/config/logger';
import { AppResponse } from '@/types/types';
import { CommunityRole, PrismaClient } from '@prisma/client';
import dayjs from 'dayjs';
import { Service } from '../base/service.base';

export class MemberAnalyticsService extends Service {
    constructor(prisma: PrismaClient) {
        super(new Logger('MemberAnalyticsService', 'MEMBER_ANALYTICS_SERVICE'));
    }

    async calculateMemberEngagement(memberId: string, tenantId?: string, branchId?: string): Promise<AppResponse> {
        return this.run(async () => {
            const memberships = await this.prisma.communityMember.findMany({
                where: {
                    memberId,
                    status: 'ACTIVE',
                    ...(tenantId ? { community: { tenantId } } : {}),
                    ...(branchId ? { community: { branchId } } : {}),
                },
                include: { community: true },
            });

            const totalCommunities = memberships.length;
            const inactiveThreshold = dayjs().subtract(45, 'day').toDate();
            const inactiveCommunities = memberships.filter((m) => m.updatedAt <= inactiveThreshold).length;

            const engagementScore =
                totalCommunities === 0 ? 0 : ((totalCommunities - inactiveCommunities) / totalCommunities) * 100;

            return this.success({
                data: {
                    memberId,
                    totalCommunities,
                    inactiveCommunities,
                    engagementScore,
                },
                message: 'Member engagement calculated successfully',
            });
        }, 'Failed to calculate member engagement');
    }

    async calculateCommunityHealth(communityId: string, tenantId?: string, branchId?: string): Promise<AppResponse> {
        return this.run(async () => {
            const communityMembers = await this.prisma.communityMember.findMany({
                where: {
                    communityId,
                    ...(tenantId ? { community: { tenantId } } : {}),
                    ...(branchId ? { community: { branchId } } : {}),
                },
            });

            const activeMembers = communityMembers.filter((m) => m.status === 'ACTIVE').length;
            const totalMembers = communityMembers.length;
            const churnRate = totalMembers === 0 ? 0 : 1 - activeMembers / totalMembers;

            const leaders = communityMembers.filter((m) => m.role === CommunityRole.LEADER).length;
            const assistants = communityMembers.filter((m) => m.role === CommunityRole.ASSISTANT_LEADER).length;

            const leadershipScore = Math.min(leaders * 70 + assistants * 30, 100);
            const membershipScore = Math.min(activeMembers / 30, 1) * 100;
            const activityScore = (1 - churnRate) * 100;

            const healthScore = leadershipScore * 0.35 + membershipScore * 0.4 + activityScore * 0.25;

            return this.success({
                data: {
                    communityId,
                    totalMembers,
                    activeMembers,
                    churnRate,
                    leaders,
                    assistants,
                    healthScore: Math.min(Math.max(healthScore, 0), 100),
                },
                message: 'Community health calculated successfully',
            });
        }, 'Failed to calculate community health');
    }

    async detectOverloadedLeaders(threshold = 3, tenantId?: string, branchId?: string): Promise<AppResponse> {
        return this.run(async () => {
            const leaders = await this.prisma.communityMember.findMany({
                where: {
                    role: { in: [CommunityRole.LEADER, CommunityRole.ASSISTANT_LEADER] },
                    ...(tenantId ? { community: { tenantId } } : {}),
                    ...(branchId ? { community: { branchId } } : {}),
                },
            });

            const counts: Record<string, number> = {};
            for (const l of leaders) {
                counts[l.memberId] = (counts[l.memberId] || 0) + 1;
            }

            const overloaded = Object.entries(counts)
                .filter(([_, count]) => count > threshold)
                .map(([memberId, count]) => ({
                    memberId,
                    communitiesLedOrAssisted: count,
                }));

            return this.success({
                data: overloaded,
                message: 'Overloaded leaders detected successfully',
            });
        }, 'Failed to detect overloaded leaders');
    }

    async communityGrowthVelocity(
        communityId: string,
        tenantId?: string,
        branchId?: string,
        options?: { startDate?: Date; endDate?: Date; windowDays?: number },
    ): Promise<AppResponse> {
        return this.run(async () => {
            const windowDays = options?.windowDays ?? 30;
            const endDate = options?.endDate ?? new Date();
            const startDate = options?.startDate ?? dayjs(endDate).subtract(windowDays, 'day').toDate();

            const joins = await this.prisma.communityMember.count({
                where: {
                    communityId,
                    joinedAt: { gte: startDate, lte: endDate },
                    ...(tenantId ? { community: { tenantId } } : {}),
                    ...(branchId ? { community: { branchId } } : {}),
                },
            });

            const leaves = await this.prisma.communityMember.count({
                where: {
                    communityId,
                    leftAt: { gte: startDate, lte: endDate },
                    ...(tenantId ? { community: { tenantId } } : {}),
                    ...(branchId ? { community: { branchId } } : {}),
                },
            });

            return this.success({
                data: {
                    communityId,
                    startDate,
                    endDate,
                    joins,
                    leaves,
                    velocity: (joins - leaves) / windowDays,
                },
                message: 'Community growth velocity calculated successfully',
            });
        }, 'Failed to calculate community growth velocity');
    }

    async communityGrowthVelocityAcrossCommunities(
        tenantId: string,
        branchId?: string,
        options?: { startDate?: Date; endDate?: Date; windowDays?: number },
    ): Promise<AppResponse> {
        return this.run(async () => {
            const windowDays = options?.windowDays ?? 30;
            const endDate = options?.endDate ?? new Date();
            const startDate = options?.startDate ?? dayjs(endDate).subtract(windowDays, 'day').toDate();

            const communities = await this.prisma.community.findMany({
                where: {
                    tenantId,
                    ...(branchId ? { branchId } : {}),
                    status: 'ACTIVE',
                },
                select: { id: true, name: true },
            });

            const results = await Promise.all(
                communities.map(async (community) => {
                    const joins = await this.prisma.communityMember.count({
                        where: { communityId: community.id, joinedAt: { gte: startDate, lte: endDate } },
                    });
                    const leaves = await this.prisma.communityMember.count({
                        where: { communityId: community.id, leftAt: { gte: startDate, lte: endDate } },
                    });
                    return {
                        communityId: community.id,
                        name: community.name,
                        joins,
                        leaves,
                        velocity: (joins - leaves) / windowDays,
                    };
                }),
            );

            results.sort((a, b) => b.velocity - a.velocity);

            return this.success({
                data: {
                    tenantId,
                    branchId: branchId ?? null,
                    startDate,
                    endDate,
                    windowDays,
                    data: results,
                },
                message: 'Community growth velocity across communities calculated successfully',
            });
        }, 'Failed to calculate community growth velocity across communities');
    }

    async analyzeLeaderLoad(memberId: string, tenantId?: string, branchId?: string): Promise<AppResponse> {
        return this.run(async () => {
            const communitiesLed = await this.prisma.communityMember.count({
                where: {
                    memberId,
                    role: CommunityRole.LEADER,
                    ...(tenantId ? { community: { tenantId } } : {}),
                    ...(branchId ? { community: { branchId } } : {}),
                },
            });

            const communitiesAssisted = await this.prisma.communityMember.count({
                where: {
                    memberId,
                    role: CommunityRole.ASSISTANT_LEADER,
                    ...(tenantId ? { community: { tenantId } } : {}),
                    ...(branchId ? { community: { branchId } } : {}),
                },
            });

            const loadScore = communitiesLed + communitiesAssisted * 0.6;

            return this.success({
                data: {
                    memberId,
                    communitiesLed,
                    communitiesAssisted,
                    loadScore,
                    status: loadScore <= 3 ? 'HEALTHY' : loadScore <= 6 ? 'BUSY' : 'OVERLOADED',
                },
                message: 'Leader load analyzed successfully',
            });
        }, 'Failed to analyze leader load');
    }
}
