import { Branch, Prisma, PrismaClient } from '@prisma/client';

import Logger from '@/config/logger';
import { BranchRepository, UserBranchAssignmentRepository } from '@/repository/tenant/branch.repository';
import { TenantRepository } from '@/repository/tenant/tenant.repository';
import { AppResponse } from '@/types/types';
import { Service } from '../base/service.base';

import {
    AssignUserToBranchDto,
    BranchListQueryDto,
    CloseBranchDto,
    CreateBranchDto,
    CreateChildBranchDto,
    CreatePrimaryBranchDto,
    RemoveUserFromBranchDto,
    UpdateBranchDto,
    UpdateBranchHierarchyDto,
    UpdateBranchStatusDto,
} from '@/DTOs/tenant/branch.dto';

/**
 * Service for managing branches within a tenant.
 */
export class BranchService extends Service {
    private branchRepo: BranchRepository;
    private tenantRepo: TenantRepository;
    private branchUserAssignmentRepo: UserBranchAssignmentRepository;

    constructor(prisma: PrismaClient) {
        super(new Logger('BranchService', 'BRANCH_CORE_SERVICE'));
        this.branchRepo = new BranchRepository(prisma);
        this.tenantRepo = new TenantRepository(prisma);
        this.branchUserAssignmentRepo = new UserBranchAssignmentRepository(prisma);
    }


    /**
     * Ensure branch code and slug are unique within a tenant.
     *
     * @param tenantId - Tenant ID
     * @param code - Branch code
     * @param slug - Branch slug
     * @param excludeId - Optional branch ID to exclude (for updates)
     * @throws Error if code or slug already exists for the tenant
     */
    private async ensureUniqueBranchFields(
        tenantId: string,
        code?: string,
        slug?: string,
        excludeId?: string,
    ): Promise<void> {
        if (code) {
            const existingCode: Branch | null = await this.branchRepo.findFirst({
                tenantId,
                code,
                isDeleted: false,
                id: { not: excludeId },
            });
            if (existingCode) {
                throw new Error(`Branch code "${code}" already exists for this tenant`);
            }
        }

        if (slug) {
            const existingSlug: Branch | null = await this.branchRepo.findFirst({
                tenantId,
                slug,
                isDeleted: false,
                id: { not: excludeId },
            });
            if (existingSlug) {
                throw new Error(`Branch slug "${slug}" already exists for this tenant`);
            }
        }
    }

    /**
     * Validate that a tenant exists and optional parent branch exists and belongs to the same tenant.
     *
     * @param tenantId - Tenant ID
     * @param parentBranchId - Optional parent branch ID
     * @throws Error if tenant or parent branch does not exist or belongs to a different tenant
     */
    private async validateTenantAndParent(tenantId: string, parentBranchId?: string): Promise<void> {
        const tenant = await this.tenantRepo.findById({ id: tenantId });
        if (!tenant) {
            throw new Error(`Tenant with ID "${tenantId}" does not exist`);
        }

        if (parentBranchId) {
            const parentBranch = await this.branchRepo.findById({
                id: parentBranchId,
            });
            if (!parentBranch) {
                throw new Error(`Parent branch with ID "${parentBranchId}" not found`);
            }
            if (parentBranch.tenantId !== tenantId) {
                throw new Error('Parent branch does not belong to the same tenant');
            }
        }
    }



    /**
     * Internal helper to create any type of branch with proper relation connections.
     *
     * @param data - Branch creation DTO
     * @returns Created branch
     */
    private async createBranchInternal(
        data: CreateBranchDto | CreatePrimaryBranchDto | CreateChildBranchDto,
        tenantId: string,
    ): Promise<Branch> {
        await this.validateTenantAndParent(tenantId, (data as CreateChildBranchDto).parentBranchId);
        await this.ensureUniqueBranchFields(tenantId, data.code, data.slug);

        const { parentBranchId, ...rest } = data;

        const branchData: Prisma.BranchCreateInput = {
            ...rest,
            tenant: { connect: { id: tenantId } },
            ...(parentBranchId ? { parent: { connect: { id: parentBranchId } } } : {}),
        };

        return this.branchRepo.create(branchData);
    }

    /** ----------------------- Public Methods ----------------------- */

    /**
     * Create a standard branch.
     *
     * @param data - Branch creation data
     * @returns AppResponse containing the created branch
     */
    async createBranch(data: CreateBranchDto, tenantId: string): Promise<AppResponse> {
        return this.run(async () => {
            const branch = await this.createBranchInternal(data, tenantId);
            return this.success({
                data: branch,
                message: 'Branch created successfully',
            });
        }, 'Failed to create branch');
    }

    /**
     * Create a primary branch for a tenant.
     *
     * @param data - Primary branch creation data
     * @returns AppResponse containing the created primary branch
     */
    async createPrimaryBranch(data: CreatePrimaryBranchDto, tenantId: string): Promise<AppResponse> {
        return this.run(async () => {
            const branch = await this.createBranchInternal(data, tenantId);
            return this.success({
                data: branch,
                message: 'Primary branch created successfully',
            });
        }, 'Failed to create primary branch');
    }

    /**
     * Create a child branch under a parent branch.
     *
     * @param data - Child branch creation data
     * @returns AppResponse containing the created child branch
     */
    async createChildBranch(data: CreateChildBranchDto, tenantId: string): Promise<AppResponse> {
        return this.run(async () => {
            const branch = await this.createBranchInternal(data, tenantId);
            return this.success({
                data: branch,
                message: 'Child branch created successfully',
            });
        }, 'Failed to create child branch');
    }

    /**
     * Update branch details.
     *
     * @param id - Branch ID
     * @param data - Branch update DTO
     * @returns AppResponse containing the updated branch
     */
    async updateBranch(id: string, data: UpdateBranchDto): Promise<AppResponse> {
        return this.run(async () => {
            const existing = await this.branchRepo.findById({ id });
            if (!existing) {
                throw new Error(`Branch with ID "${id}" does not exist`);
            }

            await this.ensureUniqueBranchFields(existing.tenantId, data.code, data.slug, id);

            const updateData: Prisma.BranchUpdateInput = {
                ...data,
                tenant: { connect: { id: existing.tenantId } },
            };

            if (data.parentBranchId) {
                await this.validateTenantAndParent(existing.tenantId, data.parentBranchId);
                if (data.parentBranchId === id) {
                    throw new Error('Branch cannot be parent of itself');
                }
                updateData.parent = { connect: { id: data.parentBranchId } };
            }

            const updated = await this.branchRepo.update({ id }, updateData);
            return this.success({
                data: updated,
                message: 'Branch updated successfully',
            });
        }, 'Failed to update branch');
    }

    /**
     * Update branch hierarchy (parent branch and type).
     *
     * @param id - Branch ID
     * @param data - Hierarchy update DTO
     * @returns AppResponse containing the updated branch
     */
    async updateBranchHierarchy(id: string, data: UpdateBranchHierarchyDto): Promise<AppResponse> {
        return this.run(async () => {
            const existing = await this.branchRepo.findById({ id });
            if (!existing) {
                throw new Error(`Branch with ID "${id}" does not exist`);
            }

            const updateData: Prisma.BranchUpdateInput = {};
            if (data.parentBranchId) {
                await this.validateTenantAndParent(existing.tenantId, data.parentBranchId);
                if (data.parentBranchId === id) {
                    throw new Error('Branch cannot be parent of itself');
                }
                updateData.parent = { connect: { id: data.parentBranchId } };
            }

            if (data.type) {
                updateData.type = data.type;
            }

            const updated = await this.branchRepo.update({ id }, updateData);
            return this.success({
                data: updated,
                message: 'Branch hierarchy updated successfully',
            });
        }, 'Failed to update branch hierarchy');
    }

    /**
     * Update branch status (ACTIVE, INACTIVE, CLOSED, etc.).
     *
     * @param id - Branch ID
     * @param data - Status update DTO
     * @returns AppResponse containing the updated branch status
     */
    async updateBranchStatus(id: string, data: UpdateBranchStatusDto): Promise<AppResponse> {
        return this.run(async () => {
            const updated = await this.branchRepo.update({ id }, data);
            return this.success({
                data: updated,
                message: 'Branch status updated successfully',
            });
        }, 'Failed to update branch status');
    }

    /**
     * Close a branch with a reason.
     *
     * @param id - Branch ID
     * @param data - Branch closure DTO
     * @returns AppResponse containing the closed branch
     */
    async closeBranch(id: string, data: CloseBranchDto): Promise<AppResponse> {
        return this.run(async () => {
            const updated = await this.branchRepo.update({ id }, data);
            return this.success({
                data: updated,
                message: `Branch closed: ${data.reason}`,
            });
        }, 'Failed to close branch');
    }

    /**
     * Assign a user to a branch.
     *
     * This method ensures the branch and user exist, checks if the user
     * is already assigned to the branch, and then creates the assignment
     * using Prisma's `connect` syntax.
     *
     * @param data - DTO containing `branchId`, `userId`, and optional `isPrimary` flag
     * @returns AppResponse containing the created or existing branch-user assignment
     * @throws Error if the branch or user does not exist
     */
    async assignUserToBranch(data: AssignUserToBranchDto): Promise<AppResponse> {
        return this.run(async () => {
            const { branchId, userId, isPrimary = false } = data;

            // Ensure the branch exists
            const branch = await this.branchRepo.findById({ id: branchId });
            if (!branch) {
                throw new Error(`Branch with ID "${branchId}" not found`);
            }

            // Ensure the user exists
            const user = await this.branchRepo.exists({ id: userId });
            if (!user) {
                throw new Error(`User with ID "${userId}" not found`);
            }

            // Check if the user is already assigned
            const existingAssignment = await this.branchUserAssignmentRepo.findByUserAndBranch(userId, branchId);
            if (existingAssignment) {
                return this.success({
                    data: existingAssignment,
                    message: 'User is already assigned to this branch',
                });
            }

            // Create the assignment using `connect`
            const assignment = await this.branchUserAssignmentRepo.assignUserToBranch({
                user: { connect: { id: userId } },
                branch: { connect: { id: branchId } },
                isPrimary,
            });

            return this.success({
                data: assignment,
                message: 'User assigned to branch successfully',
            });
        }, 'Failed to assign user to branch');
    }

    /**
     * Remove a user from a branch.
     *
     * This method removes the assignment of a user from a branch if it exists.
     *
     * @param branchId - Branch ID
     * @param data - DTO containing the `userId` to remove
     * @returns AppResponse confirming removal
     */
    async removeUserFromBranch(branchId: string, data: RemoveUserFromBranchDto): Promise<AppResponse> {
        return this.run(async () => {
            const { userId } = data;

            // Check if the assignment exists
            const assignment = await this.branchUserAssignmentRepo.findByUserAndBranch(userId, branchId);
            if (!assignment) {
                return this.success({
                    message: 'No assignment found for this user in the branch',
                });
            }

            // Remove the assignment
            await this.branchUserAssignmentRepo.removeUserFromBranch(userId, branchId);

            return this.success({
                message: 'User removed from branch successfully',
            });
        }, 'Failed to remove user from branch');
    }

    /**
     * List branches with filters, sorting, and pagination.
     *
     * @param query - Branch list query DTO
     * @returns AppResponse containing branches and pagination metadata
     */
    async listBranches(query: BranchListQueryDto, tenantId: string): Promise<AppResponse> {
        return this.run(async () => {
            const {
                page = 1,
                limit = 20,
                sortBy = 'createdAt',
                sortOrder = 'desc',
                status,
                type,
                parentBranchId,
                isDeleted = false,
            } = query;

            const where: Prisma.BranchWhereInput = {
                tenantId,
                isDeleted,
                ...(status && { status }),
                ...(type && { type }),
                ...(parentBranchId && { parentBranchId }),
            };

            const orderBy: Prisma.Enumerable<Prisma.BranchOrderByWithRelationInput> = {
                [sortBy]: sortOrder,
            };

            const res = await this.branchRepo.findAll(where, orderBy, {
                page,
                limit,
            });
            return this.success({
                data: res.data,
                pagination: res.pagination,
                message: 'Branches retrieved successfully',
            });
        }, 'Failed to retrieve branches');
    }
}
