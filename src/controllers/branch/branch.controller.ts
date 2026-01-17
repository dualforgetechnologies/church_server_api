import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';

import Logger from '@/config/logger';
import { BranchService } from '@/service/tenant/branch.service';
import { Controller } from '../controller';

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

export class BranchController extends Controller {
    private readonly branchService: BranchService;
    private readonly logger: Logger;

    constructor() {
        super();

        const prisma = new PrismaClient();

        this.branchService = new BranchService(prisma);
        this.logger = new Logger('BranchController', 'BRANCH_CONTROLLER');
    }

    /**
     * Create a branch
     */
    createBranch = async (req: Request, res: Response) => {
        try {
            const payload = req.body as CreateBranchDto;
            const result = await this.branchService.createBranch(payload, req.tenantId);
            return this.response(res, result);
        } catch (error) {
            return this.error({
                res,
                error,
                logger: this.logger,
                message: 'Failed to create branch',
            });
        }
    };

    /**
     * Create primary branch
     */
    createPrimaryBranch = async (req: Request, res: Response) => {
        try {
            const payload = req.body as CreatePrimaryBranchDto;
            const result = await this.branchService.createPrimaryBranch(payload, req.tenantId);
            return this.response(res, result);
        } catch (error) {
            return this.error({
                res,
                error,
                logger: this.logger,
                message: 'Failed to create primary branch',
            });
        }
    };

    /**
     * Create child branch
     */
    createChildBranch = async (req: Request, res: Response) => {
        try {
            const payload = req.body as CreateChildBranchDto;
            const result = await this.branchService.createChildBranch(payload, req.tenantId);
            return this.response(res, result);
        } catch (error) {
            return this.error({
                res,
                error,
                logger: this.logger,
                message: 'Failed to create child branch',
            });
        }
    };

    /**
     * Update branch
     */
    updateBranch = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const payload = req.body as UpdateBranchDto;
            const result = await this.branchService.updateBranch(id, payload);
            return this.response(res, result);
        } catch (error) {
            return this.error({
                res,
                error,
                logger: this.logger,
                message: 'Failed to update branch',
            });
        }
    };

    /**
     * Update branch hierarchy
     */
    updateBranchHierarchy = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const payload = req.body as UpdateBranchHierarchyDto;
            const result = await this.branchService.updateBranchHierarchy(id, payload);
            return this.response(res, result);
        } catch (error) {
            return this.error({
                res,
                error,
                logger: this.logger,
                message: 'Failed to update branch hierarchy',
            });
        }
    };

    /**
     * Update branch status
     */
    updateBranchStatus = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const payload = req.body as UpdateBranchStatusDto;
            const result = await this.branchService.updateBranchStatus(id, payload);
            return this.response(res, result);
        } catch (error) {
            return this.error({
                res,
                error,
                logger: this.logger,
                message: 'Failed to update branch status',
            });
        }
    };

    /**
     * Close branch
     */
    closeBranch = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const payload = req.body as CloseBranchDto;
            const result = await this.branchService.closeBranch(id, payload);
            return this.response(res, result);
        } catch (error) {
            return this.error({
                res,
                error,
                logger: this.logger,
                message: 'Failed to close branch',
            });
        }
    };

    /**
     * Assign user to branch
     */
    assignUserToBranch = async (req: Request, res: Response) => {
        try {
            const payload = req.body as AssignUserToBranchDto;
            const result = await this.branchService.assignUserToBranch(payload);
            return this.response(res, result);
        } catch (error) {
            return this.error({
                res,
                error,
                logger: this.logger,
                message: 'Failed to assign user to branch',
            });
        }
    };

    /**
     * Remove user from branch
     */
    removeUserFromBranch = async (req: Request, res: Response) => {
        try {
            const { branchId } = req.params;
            const payload = req.body as RemoveUserFromBranchDto;
            const result = await this.branchService.removeUserFromBranch(branchId, payload);
            return this.response(res, result);
        } catch (error) {
            return this.error({
                res,
                error,
                logger: this.logger,
                message: 'Failed to remove user from branch',
            });
        }
    };

    /**
     * List branches
     */
    listBranches = async (req: Request, res: Response) => {
        try {
            const query = req.query as unknown as BranchListQueryDto;
            const result = await this.branchService.listBranches(query, req.tenantId);
            return this.response(res, result);
        } catch (error) {
            return this.error({
                res,
                error,
                logger: this.logger,
                message: 'Failed to retrieve branches',
            });
        }
    };
    /**
     * Get branch by ID
     */
    getBranchById = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;

            const result = await this.branchService.getBranchById(id, req.tenantId);
            return this.response(res, result);
        } catch (error) {
            return this.error({
                res,
                error,
                logger: this.logger,
                message: 'Failed to retrieve branch',
            });
        }
    };
}

export const branchController = new BranchController();
