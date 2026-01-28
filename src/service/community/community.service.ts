import Logger from '@/config/logger';
import { Community, CommunityType, Month, Prisma, PrismaClient, Tenant } from '@prisma/client';

import { CommunityListQueryDto, CreateCommunityDto, UpdateCommunityDto } from '@/DTOs/community/community.dto';
import { CommunityRepository } from '@/repository/community/community.repository';
import { AppResponse } from '@/types/types';
import { StatusCodes } from 'http-status-codes';
import { Service } from '../base/service.base';
import { CommunityMemberService } from './communityMember.service';

export class CommunityService extends Service {
    private communityRepo: CommunityRepository;
    private communityMemberService: CommunityMemberService;

    constructor(prisma: PrismaClient) {
        super(new Logger('CommunityService', 'COMMUNITY_CORE_SERVICE'));
        this.communityRepo = new CommunityRepository(prisma);
        this.communityMemberService = new CommunityMemberService(prisma);
    }

    private async validateUniqueCommunityName(
        branchId: string,
        name: string,
        type: CommunityType,
        excludeId?: string,
        compareTo?: Community,
    ) {
        const existing = await this.communityRepo.findFirst({
            branchId,
            name,
            type,
        });
        if (existing) {
            if (compareTo) {
                if (existing.id !== compareTo.id) {
                    throw new Error(`Community with name "${name}" already exists in this branch`);
                }
            } else {
                throw new Error(`Community with name "${name}" already exists in this branch`);
            }
        }
    }

    /**
     * Validate uniqueness of type-specific community info.
     */
    private async validateUniqueCommunityInfo(data: Omit<CreateCommunityDto, 'membersIds'>, compareTo?: Community) {
        const { branchId, type, country, location, gender, profession, month } = data;

        const where: Prisma.CommunityWhereInput = { branchId, type };

        switch (type) {
            case 'CELL':
                where.country = country;
                where.location = location;
                break;
            case 'MINISTRY':
                where.gender = gender;
                break;
            case 'PROFESSION':
                where.profession = profession;
                break;
            case 'TRIBE':
                where.month = month;
                break;
            default:
                return;
        }

        const existing = await this.communityRepo.findFirst(where);
        if (existing) {
            if (compareTo) {
                if (existing.id !== compareTo.id) {
                    throw new Error(
                        `A ${type} community with the same unique information already exists in this branch`,
                    );
                }
            } else {
                throw new Error(`A ${type} community with the same unique information already exists in this branch`);
            }
        }
    }

    async createCommunity(
        data: CreateCommunityDto,
        tenant: Tenant,
        actingUserId?: string,
    ): Promise<AppResponse<Community>> {
        return this.run(async () => {
            await this.validateUniqueCommunityName(data.branchId, data.name, data.type);
            await this.validateUniqueCommunityInfo(data);

            // Prepare community data

            const { branchId, type, gender, profession, location, country, month, membersIds, ...rest } = data;
            let communityInfo: Partial<
                Pick<Community, 'type' | 'gender' | 'profession' | 'location' | 'country' | 'month'>
            > = { type };
            if (type === 'CELL') {
                communityInfo = { country, location, type };
            }
            if (type === 'MINISTRY') {
                communityInfo = { type, gender };
            }
            if (type === 'PROFESSION') {
                communityInfo = { type, profession };
            }
            if (type === 'TRIBE') {
                communityInfo = { type, month };
            }
            const communityData: Prisma.CommunityCreateInput = {
                ...rest,
                tenant: { connect: { id: tenant.id } },
                branch: { connect: { id: data.branchId } },
                ...communityInfo,
                type: data.type,
                ...(actingUserId && {
                    creator: {
                        connect: { id: actingUserId },
                    },
                }),
            };

            const community = await this.communityRepo.create(communityData);

            if (membersIds.length) {
                try {
                    await this.communityMemberService.createCommunityMembers(
                        {
                            membersIds,
                            communityId: community.id,
                            status: 'ACTIVE',
                            role: 'MEMBER',
                        },
                        tenant,
                        false,
                    );
                } catch (error) {}
            }
            return this.success({
                data: community,
                message: 'Community created successfully',
            });
        }, 'Failed to create community');
    }

    async updateCommunity(id: string, tenantId: string, data: UpdateCommunityDto): Promise<AppResponse> {
        return this.run(async () => {
            const existing = await this.communityRepo.findUnique({ id, tenantId });
            if (!existing) {
                throw new Error(`Community with ID "${id}" not found`);
            }
            await this.validateUniqueCommunityName(data.branchId, data.name, data.type, undefined, existing);
            await this.validateUniqueCommunityInfo(data, existing);

            const { branchId, type, gender, profession, location, country, month } = data;
            let communityInfo: Partial<
                Pick<Community, 'type' | 'gender' | 'profession' | 'location' | 'country' | 'month' | 'branchId'>
            > = { type };
            if (type === 'CELL') {
                communityInfo = { country, location, type, branchId };
            }
            if (type === 'MINISTRY') {
                communityInfo = { type, gender, branchId };
            }
            if (type === 'PROFESSION') {
                communityInfo = { type, profession, branchId };
            }
            if (type === 'TRIBE') {
                communityInfo = { type, month, branchId };
            }

            if (data.name) {
                await this.validateUniqueCommunityName(branchId, data.name, data.type, id, existing);
            }

            const updated = await this.communityRepo.update(
                { id },
                {
                    ...data,
                    ...communityInfo,
                },
            );
            return this.success({
                data: updated,
                message: 'Community updated successfully',
            });
        }, 'Failed to update community');
    }

    async getCommunityById(
        id: string,
        tenantId: string,
        includeMembers = false,
        type?: CommunityType,
    ): Promise<AppResponse<Community>> {
        return this.run(async () => {
            const community = await this.communityRepo.findUnique<Prisma.CommunityInclude>(
                { id, tenantId, ...(type && { type }) },
                {
                    include: {
                        creator: {
                            select: {
                                id: true,
                                role: true,
                                roleAssignments: true,
                                member: true,
                            },
                        },
                    },
                },
            );
            if (!community) {
                return this.error(`Community with ID "${id}" not found`, StatusCodes.NOT_FOUND);
            }
            return this.success({
                data: community,
                message: 'Community retrieved successfully',
            });
        }, 'Failed to retrieve community');
    }

    async listCommunities(query: CommunityListQueryDto, tenantId: string): Promise<AppResponse> {
        return this.run(async () => {
            const {
                page = 1,
                limit = 20,
                sortBy = 'createdAt',
                sortOrder = 'desc',
                branchId,
                search,
                memberId,
                ...filters
            } = query;

            const where: Prisma.CommunityWhereInput = {
                ...filters,
                tenantId,
                ...(branchId && {
                    branchId,
                }),

                ...(memberId && {
                    members: {
                        some: {
                            memberId,
                        },
                    },
                }),
                ...(search && {
                    OR: [
                        {
                            name: { contains: search, mode: 'insensitive' },
                        },
                        {
                            month: { equals: search as Month },
                        },
                        {
                            location: { contains: search, mode: 'insensitive' },
                        },
                        {
                            gender: { contains: search, mode: 'insensitive' },
                        },
                    ],
                }),
            };

            const orderBy: Prisma.Enumerable<Prisma.CommunityOrderByWithRelationInput> = {
                [sortBy]: sortOrder,
            };

            const res = await this.communityRepo.findAll<Prisma.CommunityInclude>(
                where,
                orderBy,
                {
                    page,
                    limit,
                },
                {
                    include: {
                        creator: {
                            select: {
                                id: true,
                                role: true,
                                roleAssignments: true,
                                member: true,
                            },
                        },
                    },
                },
            );
            return this.success({
                data: res.data,
                pagination: res.pagination,
                message: 'Communities retrieved successfully',
            });
        }, 'Failed to retrieve communities');
    }

    async archiveCommunity(id: string): Promise<AppResponse> {
        return this.run(async () => {
            const updated = await this.communityRepo.update({ id }, { archivedAt: new Date() });
            return this.success({
                data: updated,
                message: 'Community archived successfully',
            });
        }, 'Failed to archive community');
    }

    async deleteCommunity(id: string): Promise<AppResponse> {
        return this.run(async () => {
            const deleted = await this.communityRepo.delete({ id });
            return this.success({
                data: deleted,
                message: 'Community deleted successfully',
            });
        }, 'Failed to delete community');
    }
}
