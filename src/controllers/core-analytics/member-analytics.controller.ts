import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';

import { CommunityGrowthVelocityQuery, CommunityGrowthVelocitySingleQuery } from '@/DTOs/analytics';
import Logger from '@/config/logger';
import { MemberAnalyticsService } from '@/service/core-analytics/member-analytics.service';
import { Controller } from '../controller';

export class MemberAnalyticsController extends Controller {
    private readonly memberAnalyticsService: MemberAnalyticsService;
    private readonly logger: Logger;

    constructor() {
        super();

        const prisma = new PrismaClient();
        this.memberAnalyticsService = new MemberAnalyticsService(prisma);
        this.logger = new Logger('MemberAnalyticsController', 'MEMBER_ANALYTICS_CONTROLLER');
    }

    private validateQueryParams(requiredFields: string[], query: Record<string, unknown>) {
        const missing = requiredFields.filter((field) => query[field] === undefined);
        if (missing.length > 0) {
            throw new Error(`Missing required query parameter(s): ${missing.join(', ')}`);
        }
    }

    /**
     * Calculate member engagement
     * Required: memberId
     */
    calculateMemberEngagement = async (req: Request, res: Response) => {
        try {
            this.validateQueryParams(['memberId'], req.query);

            const { memberId, branchId } = req.query as unknown as {
                memberId: string;
                branchId?: string;
            };

            const result = await this.memberAnalyticsService.calculateMemberEngagement(
                memberId,
                req.tenantId,
                branchId,
            );
            return this.response(res, result);
        } catch (error) {
            return this.error({
                res,
                error,
                logger: this.logger,
                message: 'Failed to calculate member engagement',
            });
        }
    };

    /**
     * Calculate community health
     * Required: communityId
     */
    calculateCommunityHealth = async (req: Request, res: Response) => {
        try {
            this.validateQueryParams(['communityId'], req.query);

            const { communityId, branchId } = req.query as unknown as {
                communityId: string;
                branchId?: string;
            };

            const result = await this.memberAnalyticsService.calculateCommunityHealth(
                communityId,
                req.tenantId,
                branchId,
            );
            return this.response(res, result);
        } catch (error) {
            return this.error({
                res,
                error,
                logger: this.logger,
                message: 'Failed to calculate community health',
            });
        }
    };

    /**
     * Detect overloaded leaders
     * Optional: threshold, branchId
     */
    detectOverloadedLeaders = async (req: Request, res: Response) => {
        try {
            const { threshold, branchId } = req.query as unknown as {
                threshold?: number;
                branchId?: string;
            };

            const result = await this.memberAnalyticsService.detectOverloadedLeaders(
                threshold ?? 3,
                req.tenantId,
                branchId,
            );
            return this.response(res, result);
        } catch (error) {
            return this.error({
                res,
                error,
                logger: this.logger,
                message: 'Failed to detect overloaded leaders',
            });
        }
    };

    /**
     * Community growth velocity for a single community
     * Required: communityId
     */
    communityGrowthVelocity = async (req: Request, res: Response) => {
        try {
            const { communityId, branchId, startDate, endDate, windowDays } =
                req.query as unknown as CommunityGrowthVelocitySingleQuery;
            const result = await this.memberAnalyticsService.communityGrowthVelocity(
                communityId,
                req.tenantId,
                branchId,
                {
                    startDate: startDate ? new Date(startDate) : undefined,
                    endDate: endDate ? new Date(endDate) : undefined,
                    windowDays,
                },
            );
            return this.response(res, result);
        } catch (error) {
            return this.error({
                res,
                error,
                logger: this.logger,
                message: 'Failed to calculate community growth velocity',
            });
        }
    };

    /**
     * Community growth velocity across multiple communities
     * No required query fields
     */
    communityGrowthVelocityAcrossCommunities = async (req: Request, res: Response) => {
        try {
            const { branchId, startDate, endDate, windowDays } = req.query as CommunityGrowthVelocityQuery;

            const result = await this.memberAnalyticsService.communityGrowthVelocityAcrossCommunities(
                req.tenantId,
                branchId,
                {
                    startDate: startDate ? new Date(startDate) : undefined,
                    endDate: endDate ? new Date(endDate) : undefined,
                    windowDays,
                },
            );
            return this.response(res, result);
        } catch (error) {
            return this.error({
                res,
                error,
                logger: this.logger,
                message: 'Failed to calculate community growth velocity across communities',
            });
        }
    };

    /**
     * Analyze leader load
     * Required: memberId
     */
    analyzeLeaderLoad = async (req: Request, res: Response) => {
        try {
            this.validateQueryParams(['memberId'], req.query);

            const { memberId, branchId } = req.query as unknown as {
                memberId: string;
                branchId?: string;
            };

            const result = await this.memberAnalyticsService.analyzeLeaderLoad(memberId, req.tenantId, branchId);
            return this.response(res, result);
        } catch (error) {
            return this.error({
                res,
                error,
                logger: this.logger,
                message: 'Failed to analyze leader load',
            });
        }
    };
}

export const memberAnalyticsController = new MemberAnalyticsController();
