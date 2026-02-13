import express from 'express';

import { communityGrowthVelocityQueryDto } from '@/DTOs/analytics';
import { memberAnalyticsController } from '@/controllers/core-analytics/member-analytics.controller';
import { authJWT } from '@/middleware/auth.middleware';
import { tenantMiddleware } from '@/middleware/tenant.middleware';
import { validateQueryDto } from '@/middleware/validate-dto.middleware';

const memberAnalyticsRouter = express.Router();

/**
 * Calculate member engagement
 * Query params: memberId (required), branchId (optional)
 */
memberAnalyticsRouter.get(
    '/engagement',
    authJWT.authenticate,
    tenantMiddleware(),

    memberAnalyticsController.calculateMemberEngagement,
);

/**
 * Calculate community health
 * Query params: communityId (required), branchId (optional)
 */
memberAnalyticsRouter.get(
    '/community-health',
    authJWT.authenticate,
    tenantMiddleware(),

    memberAnalyticsController.calculateCommunityHealth,
);

/**
 * Detect overloaded leaders
 * Query params: threshold (optional), branchId (optional)
 */
memberAnalyticsRouter.get(
    '/overloaded-leaders',
    authJWT.authenticate,
    tenantMiddleware(),
    memberAnalyticsController.detectOverloadedLeaders,
);

/**
 * Community growth velocity for a single community
 * Query params: communityId (required), branchId (optional), startDate, endDate, windowDays
 */
memberAnalyticsRouter.get(
    '/growth-velocity',
    authJWT.authenticate,
    tenantMiddleware(),
    memberAnalyticsController.communityGrowthVelocity,
);

/**
 * Community growth velocity across multiple communities
 * Query params: branchId (optional), startDate, endDate, windowDays
 */
memberAnalyticsRouter.get(
    '/growth-velocity/multi',
    authJWT.authenticate,
    tenantMiddleware(),
    validateQueryDto(communityGrowthVelocityQueryDto),

    memberAnalyticsController.communityGrowthVelocityAcrossCommunities,
);

/**
 * Analyze leader load
 * Query params: memberId (required), branchId (optional)
 */
memberAnalyticsRouter.get(
    '/leader-load',
    authJWT.authenticate,
    tenantMiddleware(),
    memberAnalyticsController.analyzeLeaderLoad,
);

export default memberAnalyticsRouter;
