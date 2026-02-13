import Logger from '@/config/logger';
import { PrismaClient } from '@prisma/client';

import { CommunityRepository } from '@/repository/community/community.repository';

import { AppResponse } from '@/types/types';

import { Service } from '../base/service.base';

export class CommunityAnalyticsService extends Service {
    private communityRepo: CommunityRepository;

    constructor(prisma: PrismaClient) {
        super(new Logger('CommunityService', 'COMMUNITY_ANALYTICS_SERVICE'));
        this.communityRepo = new CommunityRepository(prisma);
    }

    async getCommunityCoreAnalytics(tenantId: string, branchId?: string): Promise<AppResponse> {
        return this.run(async () => {
            const where = {
                tenantId,
                ...(branchId && {
                    branchId,
                }),
            };
            const [totalCommunities, statusBreakdown, typeBreakdown, archivedCommunities] = await Promise.all([
                this.communityRepo.count({ tenantId }),

                this.prisma.community.groupBy({
                    by: ['status'],
                    where,
                    _count: true,
                }),

                this.prisma.community.groupBy({
                    by: ['type'],
                    where,
                    _count: true,
                }),

                this.communityRepo.count({
                    ...where,
                    archivedAt: { not: null },
                }),
            ]);

            return this.success({
                data: {
                    totalCommunities,
                    statusBreakdown,
                    typeBreakdown,
                    archivedCommunities,
                    activeCommunities: totalCommunities - archivedCommunities,
                },
                message: 'Community analytics retrieved successfully',
            });
        }, 'Failed to retrieve community analytics');
    }
    async getCommunityMembershipAnalytics(tenantId: string, branchId?: string): Promise<AppResponse> {
        return this.run(async () => {
            const membershipCounts = await this.communityRepo.prisma.communityMember.groupBy({
                by: ['communityId'],
                where: {
                    status: 'ACTIVE',
                    community: { tenantId },
                },
                _count: true,
            });

            const communities = await this.prisma.community.findMany({
                where: {
                    tenantId,
                    ...(branchId && { branchId }),
                },
                select: { id: true, name: true, type: true },
            });

            const countMap = new Map(membershipCounts.map((c) => [c.communityId, c._count]));

            const enriched = communities.map((c) => ({
                ...c,
                memberCount: countMap.get(c.id) ?? 0,
            }));

            const topCommunities = [...enriched].sort((a, b) => b.memberCount - a.memberCount).slice(0, 5);

            const emptyCommunities = enriched.filter((c) => c.memberCount === 0);

            const totalMembers = enriched.reduce((sum, c) => sum + c.memberCount, 0);

            return this.success({
                data: {
                    communities: enriched,
                    topCommunities,
                    emptyCommunitiesCount: emptyCommunities.length,
                    avgMembersPerCommunity: communities.length > 0 ? Math.round(totalMembers / communities.length) : 0,
                },
                message: 'Membership analytics retrieved successfully',
            });
        }, 'Failed to retrieve membership analytics');
    }

    async getCommunityDetailAnalytics(communityId: string, tenantId: string): Promise<AppResponse> {
        return this.run(async () => {
            const community = await this.prisma.community.findUnique({
                where: { id: communityId, tenantId },
                include: {
                    branch: true,
                },
            });

            if (!community) {
                throw new Error('Community not found');
            }

            const roleCounts = await this.communityRepo.prisma.communityMember.groupBy({
                by: ['role'],
                where: {
                    communityId,
                    status: 'ACTIVE',
                },
                _count: true,
            });

            const metrics = {
                totalMembers: 0,
                totalLeaders: 0,
                totalAssistantLeaders: 0,
                total: 0,
            };

            for (const rc of roleCounts) {
                if (rc.role === 'MEMBER') {
                    metrics.totalMembers = rc._count;
                }
                if (rc.role === 'LEADER') {
                    metrics.totalLeaders = rc._count;
                }
                if (rc.role === 'ASSISTANT_LEADER') {
                    metrics.totalAssistantLeaders = rc._count;
                }
                metrics.total += rc._count;
            }

            const leaders = await this.communityRepo.prisma.communityMember.findMany({
                where: {
                    communityId,
                    role: 'LEADER',
                    status: 'ACTIVE',
                },
                select: {
                    id: true,
                    joinedAt: true,
                    member: {
                        select: {
                            id: true,
                            profession: true,
                            profilePhoto: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            phone: true,
                            gender: true,
                            address: true,
                            location: true,
                            branch: {
                                select: {
                                    name: true,
                                    id: true,
                                    address: true,
                                    type: true,
                                },
                            },
                        },
                    },
                },
            });

            const assistantLeaders = await this.communityRepo.prisma.communityMember.findMany({
                where: {
                    communityId,
                    role: 'ASSISTANT_LEADER',
                    status: 'ACTIVE',
                },
                select: {
                    id: true,
                    joinedAt: true,
                    member: {
                        select: {
                            id: true,
                            profilePhoto: true,
                            profession: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            phone: true,
                            gender: true,
                            address: true,
                            location: true,
                            branch: {
                                select: {
                                    name: true,
                                    id: true,
                                    address: true,
                                    type: true,
                                },
                            },
                        },
                    },
                },
            });

            return this.success({
                data: {
                    id: community.id,
                    name: community.name,
                    type: community.type,
                    status: community.status,
                    branch: {
                        id: community.branchId,
                        name: community.branch.name,
                    },
                    memberCountPerRole: metrics,
                    leaders,
                    assistantLeaders,
                },
                message: 'Community detail analytics retrieved successfully',
            });
        }, 'Failed to retrieve community detail analytics');
    }
}
