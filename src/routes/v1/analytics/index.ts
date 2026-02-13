import express from 'express';
import branchAnalyticsRouter from './branch-analytics';
import communityAnalyticsRouter from './community-analytics';
import memberAnalyticsRouter from './member-analytics';

const analyticsRouter = express.Router();

analyticsRouter.use('/branches', branchAnalyticsRouter);
analyticsRouter.use('/communities', communityAnalyticsRouter);
analyticsRouter.use('/members', memberAnalyticsRouter);

export default analyticsRouter;
