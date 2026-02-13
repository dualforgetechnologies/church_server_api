import express from 'express';

import { branchAnalyticsController } from '@/controllers/core-analytics/branch-analytics.controller';
import { authJWT } from '@/middleware/auth.middleware';
import { tenantMiddleware } from '@/middleware/tenant.middleware';

const branchAnalyticsRouter = express.Router();

/**
 * Get core branch analytics
 * No query required
 */
branchAnalyticsRouter.get(
    '/core',
    authJWT.authenticate,
    tenantMiddleware(),
    branchAnalyticsController.getBranchCoreAnalytics,
);

/**
 * Get branch membership analytics
 * No query required
 */
branchAnalyticsRouter.get(
    '/membership',
    authJWT.authenticate,
    tenantMiddleware(),
    branchAnalyticsController.getBranchMembershipAnalytics,
);

/**
 * Get branch capacity analytics
 * No query required
 */
branchAnalyticsRouter.get(
    '/capacity',
    authJWT.authenticate,
    tenantMiddleware(),
    branchAnalyticsController.getBranchCapacityAnalytics,
);

export default branchAnalyticsRouter;
