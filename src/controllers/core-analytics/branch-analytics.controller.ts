import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';

import Logger from '@/config/logger';
import { BranchAnalyticsService } from '@/service/core-analytics/branch-analytics.service';
import { Controller } from '../controller';

export class BranchAnalyticsController extends Controller {
    private readonly branchAnalyticsService: BranchAnalyticsService;
    private readonly logger: Logger;

    constructor() {
        super();

        const prisma = new PrismaClient();
        this.branchAnalyticsService = new BranchAnalyticsService(prisma);
        this.logger = new Logger('BranchAnalyticsController', 'BRANCH_ANALYTICS_CONTROLLER');
    }

    /**
     * Get core branch analytics
     */
    getBranchCoreAnalytics = async (req: Request, res: Response) => {
        try {
            const result = await this.branchAnalyticsService.getBranchCoreAnalytics(req.tenantId);
            return this.response(res, result);
        } catch (error) {
            return this.error({
                res,
                error,
                logger: this.logger,
                message: 'Failed to retrieve branch core analytics',
            });
        }
    };

    /**
     * Get branch membership analytics
     */
    getBranchMembershipAnalytics = async (req: Request, res: Response) => {
        try {
            const result = await this.branchAnalyticsService.getBranchMembershipAnalytics(req.tenantId);
            return this.response(res, result);
        } catch (error) {
            return this.error({
                res,
                error,
                logger: this.logger,
                message: 'Failed to retrieve branch membership analytics',
            });
        }
    };

    /**
     * Get branch capacity analytics
     */
    getBranchCapacityAnalytics = async (req: Request, res: Response) => {
        try {
            const result = await this.branchAnalyticsService.getBranchCapacityAnalytics(req.tenantId);
            return this.response(res, result);
        } catch (error) {
            return this.error({
                res,
                error,
                logger: this.logger,
                message: 'Failed to retrieve branch capacity analytics',
            });
        }
    };
}

export const branchAnalyticsController = new BranchAnalyticsController();
