import Logger from '@/config/logger';
import { AppResponse } from '@/types/types';
import { Community, CommunityMember, Member, Prisma, PrismaClient, Tenant } from '@prisma/client';
import { Service } from '../base/service.base';

import {
    CommunityMembersListQueryDto,
    CreateCommunityMemberDto,
    UpdateCommunityMemberDto,
} from '@/DTOs/community/community.dto';
import { CommunityMemberRepository, CommunityRepository } from '@/repository/community/community.repository';
import { MemberRepository } from '@/repository/member.repository';
import { MailService } from '../transports/email/mail.service';

export class CommunityMemberService extends Service {
    private communityMemberRepo: CommunityMemberRepository;
    private communityRepo: CommunityRepository;
    private memberRepo: MemberRepository;
    private mailService: MailService;

    constructor(prisma: PrismaClient) {
        super(new Logger('CommunityMemberService', 'COMMUNITY_MEMBER_CORE_SERVICE'));
        this.communityMemberRepo = new CommunityMemberRepository(prisma);
        this.communityRepo = new CommunityRepository(prisma);
        this.memberRepo = new MemberRepository(prisma);
        this.mailService = new MailService();
    }

    /**
     * Validate that a member is unique in a community.
     */
    private async validateUniqueMember(data: { communityId: string; memberId: string }, compareTo?: CommunityMember) {
        const { communityId, memberId } = data;
        const existing = await this.communityMemberRepo.findFirst({
            communityId,
            memberId,
        });

        if (existing && (!compareTo || existing.id !== compareTo.id)) {
            throw new Error(`Member with ID "${memberId}" is already part of community "${communityId}"`);
        }
    }

    async createCommunityMembers(
        data: CreateCommunityMemberDto,
        tenant: Tenant,
        notifyAll: boolean,
    ): Promise<AppResponse> {
        return this.run(async () => {
            const { communityId, membersIds, role, ...rest } = data;

            // validate community ownership via tenantId
            const communityExisting = await this.communityRepo.findFirst({
                id: communityId,
                tenantId: tenant.id,
            });

            if (!communityExisting) {
                throw new Error(`Community with ID "${communityId}" not found or you do not have permission`);
            }

            const report: Array<{
                memberId: string;
                status: 'success' | 'failed';
                data?: CommunityMember;
                reason?: string;
            }> = [];

            for (const memberId of membersIds) {
                try {
                    // Check if member already exists in the community
                    await this.validateUniqueMember({ memberId, communityId });

                    // Check if member exists and belongs to tenant/branch
                    const memberExisting = await this.memberRepo.findFirst({
                        id: memberId,
                        tenantId: tenant.id,
                        ...(communityExisting.branchId && {
                            branchId: communityExisting.branchId,
                        }),
                    });

                    if (!memberExisting) {
                        throw new Error('Member not found or does not belong to community branch');
                    }
                    // Create community member
                    const member = await this.communityMemberRepo.create({
                        ...rest,
                        member: { connect: { id: memberId } },
                        community: { connect: { id: communityId } },
                        role: role ?? 'MEMBER',
                    });

                    this.notifyCommunityOnJoin({
                        community: communityExisting,
                        member: memberExisting,
                        communityMember: member,
                        notifyAll,
                        tenant,
                    });
                    report.push({
                        memberId,
                        status: 'success',
                        data: member,
                    });
                } catch (error: unknown) {
                    report.push({
                        memberId,
                        status: 'failed',
                        reason: (error as Record<string, string>).message,
                    });
                }
            }

            return this.success({
                data: report,
                message: 'Community member operation report',
            });
        }, 'Failed to add community members');
    }

    async notifyCommunityOnJoin({
        community,
        member,
        communityMember,
        notifyAll,
        tenant,
    }: {
        community: Community;
        member: Member;
        communityMember: CommunityMember;
        notifyAll: boolean;
        tenant: Tenant;
    }) {
        try {
            // Notify new member
            try {
                const sendToMember = await this.mailService.newCommunityMemberMsg({
                    to: member.email,
                    email: member.email,
                    organizationName: tenant.name,
                    role: communityMember.role ?? 'MEMBER',
                    firstName: member.firstName ?? '',
                    lastName: member.lastName ?? '',
                    logo: tenant.logo ?? '',
                    communityName: community.name,
                });
            } catch (_) {}

            if (!notifyAll) {
                return;
            }

            // Community leaders from communityMember
            const comLeaders = await prisma?.communityMember.findMany({
                where: {
                    communityId: community.id,
                    role: {
                        in: ['LEADER', 'ASSISTANT_LEADER'],
                    },
                },
                include: {
                    member: true,
                },
            });

            const leaders: Member[] = (comLeaders ?? []).map((el) => el.member).filter(Boolean);

            // Default leaders from community fields
            const defaultLeaders = await prisma?.member.findMany({
                where: {
                    id: {
                        in: [community.leaderId ?? '', community.assistantLeaderId ?? ''].filter(Boolean),
                    },
                },
            });

            // Merge + dedupe by member.id
            const leaderMap = new Map<string, Member>();

            for (const l of leaders) {
                leaderMap.set(l.id, l);
            }

            for (const l of defaultLeaders ?? []) {
                leaderMap.set(l.id, l);
            }

            const uniqueLeaders = Array.from(leaderMap.values());

            // Notify leaders
            for (const l of uniqueLeaders) {
                try {
                    await this.mailService.notifyCommunityLeaderMemberJoined({
                        to: l.email,
                        email: l.email,
                        organizationName: tenant.name,
                        role: communityMember.role ?? 'MEMBER',
                        leaderName: `${l.firstName ?? ''} ${l.lastName ?? ''}`.trim(),
                        memberName: `${member.firstName ?? ''} ${member.lastName ?? ''}`.trim(),
                        communityName: community.name ?? community.type,
                        joinDate: communityMember.joinedAt.toISOString(),
                        logo: tenant.logo ?? '',
                    });
                } catch (_) {}
            }
        } catch (_) {}
    }

    async updateCommunityMember(
        communityId: string,
        memberId: string,
        tenantId: string,
        data: UpdateCommunityMemberDto,
    ): Promise<AppResponse> {
        return this.run(async () => {
            const existing = await this.communityMemberRepo.findById<Prisma.CommunityMemberInclude>(
                {
                    communityId_memberId: {
                        communityId,
                        memberId,
                    },
                },
                {
                    include: {
                        member: true,
                    },
                },
            );
            if (!existing) {
                throw new Error(`record with community id "${communityId}" and memberId "${memberId}"  not found`);
            }

            const { leftAt, ...rest } = data;

            const updated = await this.communityMemberRepo.update(
                {
                    communityId_memberId: {
                        communityId,
                        memberId,
                    },
                },
                {
                    ...rest,
                    ...(leftAt && {
                        leftAt,
                    }),
                },
            );
            return this.success({
                data: updated,
                message: 'Community member updated successfully',
            });
        }, 'Failed to update community member');
    }

    async getCommunityMemberById(communityId: string, memberId: string, tenantId: string): Promise<AppResponse> {
        return this.run(async () => {
            const member = await this.communityMemberRepo.findById({
                communityId_memberId: {
                    communityId,
                    memberId,
                },
                community: {
                    tenantId,
                },
            });
            if (!member) {
                throw new Error(`record with community id "${communityId}" and memberId "${memberId}"  not found`);
            }
            return this.success({
                data: member,
                message: 'Community member retrieved successfully',
            });
        }, 'Failed to retrieve community member');
    }

    async listCommunityMembers(
        tenantId: string,
        communityId: string,
        query: CommunityMembersListQueryDto,
    ): Promise<AppResponse> {
        return this.run(async () => {
            const { page = 1, limit = 20, sortBy = 'joinedAt', sortOrder = 'desc', search, ...filters } = query;

            const where: Prisma.CommunityMemberWhereInput = {
                ...filters,

                community: {
                    tenantId,
                    id: communityId,
                },
                ...(search && {
                    OR: [
                        {
                            member: {
                                firstName: { contains: search, mode: 'insensitive' },
                            },
                        },
                        {
                            member: {
                                lastName: { contains: search, mode: 'insensitive' },
                            },
                        },
                        {
                            member: {
                                email: { contains: search, mode: 'insensitive' },
                            },
                        },
                        {
                            community: {
                                name: { contains: search, mode: 'insensitive' },
                            },
                        },
                    ],
                }),
            };
            const orderBy: Prisma.Enumerable<Prisma.CommunityMemberOrderByWithRelationInput> = {
                [sortBy]: sortOrder,
            };

            const res = await this.communityMemberRepo.findAll<Prisma.CommunityMemberInclude>(
                where,
                orderBy,
                {
                    page,
                    limit,
                },
                {
                    include: {
                        member: true,
                    },
                },
            );
            return this.success({
                data: res.data,
                pagination: res.pagination,
                message: 'Community members retrieved successfully',
            });
        }, 'Failed to retrieve community members');
    }

    async removeCommunityMember(communityId: string, memberId: string, tenantId: string): Promise<AppResponse> {
        return this.run(async () => {
            // Validate member exists and belongs to tenant
            const existing = await this.communityMemberRepo.findById({
                communityId_memberId: { communityId, memberId },
                community: { tenantId },
            });
            if (!existing) {
                throw new Error(
                    `Community member with ID "${memberId}" in community "${communityId}" not found or you do not have permission`,
                );
            }

            const deleted = await this.communityMemberRepo.delete({
                communityId_memberId: { communityId, memberId },
            });

            return this.success({
                data: deleted,
                message: 'Community member removed successfully',
            });
        }, 'Failed to remove community member');
    }
}
