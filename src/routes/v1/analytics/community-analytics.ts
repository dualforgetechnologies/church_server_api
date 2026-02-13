import express from 'express';

import { communityAnalyticsQueryDto, communityIdParamDto } from '@/DTOs/community/community.dto';
import { communityAnalyticsController } from '@/controllers/core-analytics/community-analytics.controller';
import { authJWT } from '@/middleware/auth.middleware';
import { tenantMiddleware } from '@/middleware/tenant.middleware';
import { validateParamsDto, validateQueryDto } from '@/middleware/validate-dto.middleware';

const communityAnalyticsRouter = express.Router();

/**
 * Get core community analytics
 * Optional query: branchId
 */
communityAnalyticsRouter.get(
    '/core',
    authJWT.authenticate,
    tenantMiddleware(),
    communityAnalyticsController.getCommunityCoreAnalytics,
);

/**
 * Get community membership analytics
 * Optional query: branchId
 */
communityAnalyticsRouter.get(
    '/membership',
    authJWT.authenticate,
    tenantMiddleware(),
    validateQueryDto(communityAnalyticsQueryDto),
    communityAnalyticsController.getCommunityMembershipAnalytics,
);

/**
 * Get detailed analytics for a specific community
 * Required param: communityId
 */
communityAnalyticsRouter.get(
    '/:communityId',
    authJWT.authenticate,
    tenantMiddleware(),
    validateParamsDto(communityIdParamDto),
    communityAnalyticsController.getCommunityDetailAnalytics,
);

export default communityAnalyticsRouter;
