import { MemberListQueryDto, UpdateMemberDto } from '@/DTOs/member/index';
import Logger from '@/config/logger';
import { MemberRepository } from '@/repository/member.repository';
import { BranchRepository } from '@/repository/tenant/branch.repository';
import { TenantRepository } from '@/repository/tenant/tenant.repository';
import { AppResponse } from '@/types/types';
import { Prisma, PrismaClient } from '@prisma/client';
import { Service } from '../base/service.base';

/**
 * Service for managing members within a tenant.
 */
export class MemberService extends Service {
    private memberRepo: MemberRepository;
    private branchRepo: BranchRepository;
    private tenantRepo: TenantRepository;

    constructor(prisma: PrismaClient) {
        super(new Logger('MemberService', 'MEMBER_CORE_SERVICE'));
        this.memberRepo = new MemberRepository(prisma);
        this.branchRepo = new BranchRepository(prisma);
        this.tenantRepo = new TenantRepository(prisma);
    }

    /**
     * Ensure a tenant exists.
     *
     * @param tenantId - Tenant ID
     * @throws Error if tenant does not exist
     */
    private async validateTenant(tenantId: string): Promise<void> {
        const tenant = await this.tenantRepo.findById({ id: tenantId });
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
        const branch = await this.branchRepo.findById({ id: branchId });
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
    async updateMember(id: string, data: UpdateMemberDto,tenantId:string): Promise<AppResponse> {
        return this.run(async () => {
            const existing = await this.memberRepo.findById({ id });
            if (!existing) {
                throw new Error(`Member with ID "${id}" does not exist`);
            }

            if (data.branchId) {
                await this.validateBranch(data.branchId, existing.tenantId);
            }
            const {branchId,...rest}=data
            const updateData: Prisma.MemberUpdateInput = {
                ...rest,
                ...(data.branchId ? { branch: { connect: { id: data.branchId } } } : {}),
            };

            const updated = await this.memberRepo.update({ id ,tenantId}, updateData);

            return this.success({ data: updated, message: 'Member updated successfully' });
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

            const res = await this.memberRepo.findAll(where, orderBy, { page, limit });

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
            const member = await this.memberRepo.findById({ id });

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
}
