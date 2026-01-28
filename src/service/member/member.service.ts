import { MemberListQueryDto, UpdateMemberCommunityDto, UpdateMemberDto } from '@/DTOs/member/index';
import Logger from '@/config/logger';
import { CommunityMemberRepository } from '@/repository/community/community.repository';
import { MemberRepository } from '@/repository/member.repository';
import { BranchRepository } from '@/repository/tenant/branch.repository';
import { TenantRepository } from '@/repository/tenant/tenant.repository';
import { AppResponse } from '@/types/types';
import { CommunityType, Gender, Prisma, PrismaClient, Tenant } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';
import { Service } from '../base/service.base';
import { CommunityService } from '../community/community.service';
import { CommunityMemberService } from '../community/communityMember.service';

/**
 * Service for managing members within a tenant.
 */
export class MemberService extends Service {
    private memberRepo: MemberRepository;
    private branchRepo: BranchRepository;
    private tenantRepo: TenantRepository;
    private communityService: CommunityService;
    private communityMemberService: CommunityMemberService;
    private communityMemberRepo: CommunityMemberRepository;

    constructor(prisma: PrismaClient) {
        super(new Logger('MemberService', 'MEMBER_CORE_SERVICE'));
        this.memberRepo = new MemberRepository(prisma);
        this.branchRepo = new BranchRepository(prisma);
        this.tenantRepo = new TenantRepository(prisma);
        this.communityMemberService = new CommunityMemberService(prisma);
        this.communityService = new CommunityService(prisma);
        this.communityMemberRepo = new CommunityMemberRepository(prisma);
    }

    /**
     * Ensure a tenant exists.
     *
     * @param tenantId - Tenant ID
     * @throws Error if tenant does not exist
     */
    private async validateTenant(tenantId: string): Promise<void> {
        const tenant = await this.tenantRepo.findUnique({ id: tenantId });
        if (!tenant) {
            throw new Error(`Tenant with ID "${tenantId}" does not exist`);
        }
    }

    /**
     * Ensure a branch exists if branchId is provided.
     *
     * @param branchId - Branch ID (optional)
     * @param tenantId - Tenant ID
     * @throws Error if branch does not exist or belongs to another tenant
     */
    private async validateBranch(branchId?: string, tenantId?: string): Promise<void> {
        if (!branchId) {
            return;
        }
        const branch = await this.branchRepo.findUnique({ id: branchId });
        if (!branch) {
            throw new Error(`Branch with ID "${branchId}" not found`);
        }
        if (tenantId && branch.tenantId !== tenantId) {
            throw new Error('Branch does not belong to the same tenant');
        }
    }

    /**
     * Update member details.
     *
     * @param id - Member ID
     * @param data - Member update DTO
     * @returns AppResponse containing the updated member
     */
    async updateMember(id: string, data: UpdateMemberDto, tenantId: string): Promise<AppResponse> {
        return this.run(async () => {
            const existing = await this.memberRepo.findUnique({ id });
            if (!existing) {
                throw new Error(`Member with ID "${id}" does not exist`);
            }

            if (data.branchId) {
                await this.validateBranch(data.branchId, existing.tenantId);
            }
            const { branchId, ...rest } = data;
            const updateData: Prisma.MemberUpdateInput = {
                ...rest,
                ...(data.branchId ? { branch: { connect: { id: data.branchId } } } : {}),
            };

            const updated = await this.memberRepo.update({ id, tenantId }, updateData);

            return this.success({
                data: updated,
                message: 'Member updated successfully',
            });
        }, 'Failed to update member');
    }

    /**
     * List members with filters, sorting, and pagination.
     *
     * @param query - Member list query DTO
     * @returns AppResponse containing members and pagination metadata
     */
    async listMembers(query: MemberListQueryDto, tenantId: string): Promise<AppResponse> {
        return this.run(async () => {
            const {
                page = 1,
                limit = 20,
                sortBy = 'createdAt',
                sortOrder = 'desc',
                branchId,
                departmentId,
                memberType,
                memberStatus,
                gender,
            } = query;

            const where: Prisma.MemberWhereInput = {
                tenantId,
                ...(branchId && { branchId }),
                ...(departmentId && { departmentId }),
                ...(memberType && { memberType }),
                ...(memberStatus && { memberStatus }),
                ...(gender && { gender }),
                isDeleted: false,
            };

            const orderBy: Prisma.Enumerable<Prisma.MemberOrderByWithRelationInput> = {
                [sortBy]: sortOrder,
            };

            const res = await this.memberRepo.findAll(where, orderBy, {
                page,
                limit,
            });

            return this.success({
                data: res.data,
                pagination: res.pagination,
                message: 'Members retrieved successfully',
            });
        }, 'Failed to retrieve members');
    }

    /**
     * Get a single member by ID with optional tenant/branch checks.
     *
     * @param id - Member ID
     * @param options - Optional filters
     * @param options.tenantId - Tenant ID to validate ownership
     * @param options.branchId - Branch ID to validate ownership
     * @returns AppResponse containing the member details
     */
    async getMemberById(id: string, options?: { tenantId?: string; branchId?: string }): Promise<AppResponse> {
        return this.run(async () => {
            const member = await this.memberRepo.findUnique({ id });

            if (!member || member.isDeleted) {
                throw new Error(`Member with ID "${id}" not found`);
            }

            if (options?.tenantId && member.tenantId !== options.tenantId) {
                throw new Error('Member does not belong to the specified tenant');
            }

            if (options?.branchId && member.branchId !== options.branchId) {
                throw new Error('Member does not belong to the specified branch');
            }

            return this.success({
                data: member,
                message: 'Member retrieved successfully',
            });
        }, 'Failed to retrieve member');
    }

    async updateMemberCommunityDto(
        memberId: string,
        data: UpdateMemberCommunityDto,
        tenant: Tenant,
    ): Promise<AppResponse> {
        return this.run(async () => {
            const tenantId = tenant.id;
            const results: UpdateResult[] = [];

            const member = await this.memberRepo.findFirst({
                id: memberId,
                tenantId,
            });

            if (!member) {
                results.push({
                    step: 'member_lookup',
                    success: false,
                    message: `No member found with id ${memberId}`,
                });

                return this.error('Member update failed', StatusCodes.BAD_REQUEST, results);
            }

            const memberBranch = member.branchId;
            const { professionCommunityId, cellCommunityId, tribeCommunityId, ministryCommunityId } = data;

            if (professionCommunityId) {
                try {
                    const profession = await this.communityService.getCommunityById(
                        professionCommunityId,
                        tenantId,
                        undefined,
                        CommunityType.PROFESSION,
                    );

                    if (!profession?.data) {
                        results.push({
                            step: 'profession_lookup',
                            success: false,
                            message: 'Profession community not found',
                        });
                    } else {
                        if (profession.data.branchId !== memberBranch) {
                            results.push({
                                step: 'branch_validation',
                                success: false,
                                message: "Profession community does not belong to the member's branch",
                            });
                        } else {
                            const memberships = await this.communityMemberRepo.getAll({
                                memberId,
                                community: { type: 'PROFESSION', branchId: memberBranch },
                            });

                            const alreadyMember = memberships.some((m) => m.communityId === profession?.data?.id);

                            if (alreadyMember) {
                                results.push({
                                    step: 'membership_check',
                                    success: false,
                                    message: 'Member already belongs to this profession community',
                                });
                            } else {
                                const addedAsMember = await this.communityMemberService.createCommunityMembers(
                                    {
                                        communityId: professionCommunityId,
                                        membersIds: [member.id],
                                        status: 'ACTIVE',
                                        role: 'MEMBER',
                                    },
                                    tenant,
                                    false,
                                );

                                if (!addedAsMember.success) {
                                    results.push({
                                        step: 'add_profession_membership',
                                        success: false,
                                        message: 'Failed to add member to profession community',
                                    });
                                } else {
                                    results.push({
                                        step: 'add_profession_membership',
                                        success: true,
                                    });

                                    if (profession.data.profession) {
                                        await this.memberRepo.update(
                                            { id: memberId },
                                            { profession: profession.data.profession },
                                        );
                                    }

                                    const oldMembershipIds = memberships.map((m) => m.communityId);

                                    if (oldMembershipIds.length) {
                                        try {
                                            for (const id of oldMembershipIds) {
                                                await this.communityMemberService.removeCommunityMember(
                                                    id,
                                                    memberId,
                                                    tenantId,
                                                );
                                            }
                                        } catch (error) {
                                            results.push({
                                                step: 'remove_old_profession_memberships',
                                                success: false,
                                                message: 'Failed to remove old profession memberships',
                                            });
                                        }
                                    }
                                }
                            }
                        }
                    }
                } catch (error) {
                    results.push({
                        step: 'profession_update',
                        success: false,
                        message: 'Unexpected error during profession update',
                    });
                }
            }
            if (cellCommunityId) {
                try {
                    const cell = await this.communityService.getCommunityById(
                        cellCommunityId,
                        tenantId,
                        undefined,
                        CommunityType.CELL,
                    );

                    if (!cell?.data) {
                        results.push({
                            step: 'cell_lookup',
                            success: false,
                            message: 'cell community not found',
                        });
                    } else {
                        if (cell.data.branchId !== memberBranch) {
                            results.push({
                                step: 'branch_validation',
                                success: false,
                                message: "Cell community does not belong to the member's branch",
                            });
                        } else {
                            const memberships = await this.communityMemberRepo.getAll({
                                memberId,
                                community: { type: CommunityType.CELL, branchId: memberBranch },
                            });
                            console.log({ memberships });

                            const alreadyMember = memberships.some((m) => m.communityId === cell?.data?.id);

                            if (alreadyMember) {
                                results.push({
                                    step: 'membership_check',
                                    success: false,
                                    message: 'Member already belongs to this cell community',
                                });
                            } else {
                                const addedAsMember = await this.communityMemberService.createCommunityMembers(
                                    {
                                        communityId: cellCommunityId,
                                        membersIds: [member.id],
                                        status: 'ACTIVE',
                                        role: 'MEMBER',
                                    },
                                    tenant,
                                    false,
                                );

                                if (!addedAsMember.success) {
                                    results.push({
                                        step: 'add_cell_membership',
                                        success: false,
                                        message: 'Failed to add member to cell community',
                                    });
                                } else {
                                    results.push({
                                        step: 'add_cell_membership',
                                        success: true,
                                    });

                                    if (cell.data.location) {
                                        await this.memberRepo.update(
                                            { id: memberId },
                                            { location: cell.data.location },
                                        );
                                    }

                                    const oldMembershipIds = memberships.map((m) => m.communityId);

                                    if (oldMembershipIds.length) {
                                        try {
                                            for (const id of oldMembershipIds) {
                                                await this.communityMemberService.removeCommunityMember(
                                                    id,
                                                    memberId,
                                                    tenantId,
                                                );
                                            }

                                            results.push({
                                                step: 'remove_old_cell_memberships',
                                                success: true,
                                            });
                                        } catch (error) {
                                            results.push({
                                                step: 'remove_old_cell_memberships',
                                                success: false,
                                                message: 'Failed to remove old cell memberships',
                                            });
                                        }
                                    }
                                }
                            }
                        }
                    }
                } catch (error) {
                    results.push({
                        step: 'cell_update',
                        success: false,
                        message: 'Unexpected error during cell update',
                    });
                }
            }

            if (tribeCommunityId) {
                try {
                    const tribe = (
                        await this.communityService.getCommunityById(
                            tribeCommunityId,
                            tenantId,
                            undefined,
                            CommunityType.TRIBE,
                        )
                    ).data;

                    if (!tribe) {
                        results.push({
                            step: 'tribe_lookup',
                            success: false,
                            message: 'tribe community not found',
                        });
                    } else {
                        if (tribe.branchId !== memberBranch) {
                            results.push({
                                step: 'branch_validation',
                                success: false,
                                message: "tribe community does not belong to the member's branch",
                            });
                        } else {
                            const memberships = await this.communityMemberRepo.getAll({
                                memberId,
                                community: { type: CommunityType.TRIBE, branchId: memberBranch },
                            });

                            const alreadyMember = memberships.some((m) => m.communityId === tribe?.id);

                            if (alreadyMember) {
                                results.push({
                                    step: 'membership_check',
                                    success: false,
                                    message: 'Member already belongs to this tribe community',
                                });
                            } else {
                                const addedAsMember = await this.communityMemberService.createCommunityMembers(
                                    {
                                        communityId: tribeCommunityId,
                                        membersIds: [member.id],
                                        status: 'ACTIVE',
                                        role: 'MEMBER',
                                    },
                                    tenant,
                                    false,
                                );

                                if (!addedAsMember.success) {
                                    results.push({
                                        step: 'add_tribe_membership',
                                        success: false,
                                        message: 'Failed to add member to tribe community',
                                    });
                                } else {
                                    results.push({
                                        step: 'add_tribe_membership',
                                        success: true,
                                    });

                                    const oldMembershipIds = memberships.map((m) => m.communityId);

                                    if (oldMembershipIds.length) {
                                        try {
                                            for (const id of oldMembershipIds) {
                                                await this.communityMemberService.removeCommunityMember(
                                                    id,
                                                    memberId,
                                                    tenantId,
                                                );
                                            }

                                            results.push({
                                                step: 'remove_old_tribe_memberships',
                                                success: true,
                                            });
                                        } catch (error) {
                                            results.push({
                                                step: 'remove_old_tribe_memberships',
                                                success: false,
                                                message: 'Failed to remove old tribe memberships',
                                            });
                                        }
                                    }
                                }
                            }
                        }
                    }
                } catch (error) {
                    results.push({
                        step: 'tribe_update',
                        success: false,
                        message: 'Unexpected error during tribe update',
                    });
                }
            }
            if (ministryCommunityId) {
                try {
                    const ministry = (
                        await this.communityService.getCommunityById(
                            ministryCommunityId,
                            tenantId,
                            undefined,
                            CommunityType.MINISTRY,
                        )
                    ).data;

                    if (!ministry) {
                        results.push({
                            step: 'ministry_lookup',
                            success: false,
                            message: 'ministry community not found',
                        });
                    } else {
                        if (ministry.branchId !== memberBranch) {
                            results.push({
                                step: 'branch_validation',
                                success: false,
                                message: "ministry community does not belong to the member's branch",
                            });
                        } else {
                            const memberships = await this.communityMemberRepo.getAll({
                                memberId,
                                community: { type: CommunityType.MINISTRY, branchId: memberBranch },
                            });

                            const alreadyMember = memberships.some((m) => m.communityId === ministry?.id);

                            if (alreadyMember) {
                                results.push({
                                    step: 'membership_check',
                                    success: false,
                                    message: 'Member already belongs to this ministry community',
                                });
                            } else {
                                const addedAsMember = await this.communityMemberService.createCommunityMembers(
                                    {
                                        communityId: ministryCommunityId,
                                        membersIds: [member.id],
                                        status: 'ACTIVE',
                                        role: 'MEMBER',
                                    },
                                    tenant,
                                    false,
                                );

                                if (!addedAsMember.success) {
                                    results.push({
                                        step: 'add_ministry_membership',
                                        success: false,
                                        message: 'Failed to add member to ministry community',
                                    });
                                } else {
                                    results.push({
                                        step: 'add_ministry_membership',
                                        success: true,
                                    });
                                    if (ministry.gender) {
                                        try {
                                            await this.memberRepo.update(
                                                { id: memberId },
                                                { gender: ministry.gender as Gender },
                                            );
                                        } catch (error) {}
                                    }

                                    const oldMembershipIds = memberships.map((m) => m.communityId);

                                    if (oldMembershipIds.length) {
                                        try {
                                            for (const id of oldMembershipIds) {
                                                await this.communityMemberService.removeCommunityMember(
                                                    id,
                                                    memberId,
                                                    tenantId,
                                                );
                                            }

                                            results.push({
                                                step: 'remove_old_ministry_memberships',
                                                success: true,
                                            });
                                        } catch (error) {
                                            results.push({
                                                step: 'remove_old_ministry_memberships',
                                                success: false,
                                                message: 'Failed to remove old ministry memberships',
                                            });
                                        }
                                    }
                                }
                            }
                        }
                    }
                } catch (error) {
                    results.push({
                        step: 'ministry_update',
                        success: false,
                        message: 'Unexpected error during ministry update',
                    });
                }
            }

            return this.success({
                data: results,
                message: 'Member update process completed',
            });
        }, 'Failed to update member');
    }
}

type UpdateResult = {
    step: string;
    success: boolean;
    message?: string;
};
