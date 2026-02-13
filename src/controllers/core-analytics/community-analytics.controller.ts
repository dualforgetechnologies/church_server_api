import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';

import Logger from '@/config/logger';
import { CommunityAnalyticsService } from '@/service/core-analytics/community-analytics.service';
import { Controller } from '../controller';

export class CommunityAnalyticsController extends Controller {
    private readonly communityAnalyticsService: CommunityAnalyticsService;
    private readonly logger: Logger;

    constructor() {
        super();

        const prisma = new PrismaClient();
        this.communityAnalyticsService = new CommunityAnalyticsService(prisma);
        this.logger = new Logger('CommunityAnalyticsController', 'COMMUNITY_ANALYTICS_CONTROLLER');
    }

    /**
     * Get core community analytics
     */
    getCommunityCoreAnalytics = async (req: Request, res: Response) => {
        try {
            const { branchId } = req.query as unknown as { branchId?: string };
            const result = await this.communityAnalyticsService.getCommunityCoreAnalytics(req.tenantId, branchId);
            return this.response(res, result);
        } catch (error) {
            return this.error({
                res,
                error,
                logger: this.logger,
                message: 'Failed to retrieve core community analytics',
            });
        }
    };

    /**
     * Get community membership analytics
     */
    getCommunityMembershipAnalytics = async (req: Request, res: Response) => {
        try {
            const { branchId } = req.query as unknown as { branchId?: string };
            const result = await this.communityAnalyticsService.getCommunityMembershipAnalytics(req.tenantId, branchId);
            return this.response(res, result);
        } catch (error) {
            return this.error({
                res,
                error,
                logger: this.logger,
                message: 'Failed to retrieve community membership analytics',
            });
        }
    };

    /**
     * Get detailed analytics for a specific community
     */
    getCommunityDetailAnalytics = async (req: Request, res: Response) => {
        try {
            const { communityId } = req.params as unknown as { communityId: string };
            const result = await this.communityAnalyticsService.getCommunityDetailAnalytics(communityId, req.tenantId);
            return this.response(res, result);
        } catch (error) {
            return this.error({
                res,
                error,
                logger: this.logger,
                message: 'Failed to retrieve community detail analytics',
            });
        }
    };
}

export const communityAnalyticsController = new CommunityAnalyticsController();
