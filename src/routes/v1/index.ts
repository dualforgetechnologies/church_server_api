import express from 'express';

import analyticsRouter from './analytics';
import branchRouter from './branch/branch.route';
import communityRouter from './community/community.route';
import memberRouter from './member/member.route';
import tenantRouter from './tenant/tenant.route';
import authRouter from './user/auth.route';
import permissionRouter from './user/permission.route';
import roleRouter from './user/role.route';
import userRouter from './user/user.route';

const router = express.Router();

router.get('/', (req, res) => {
    res.status(200).json({ message: 'Welcome to API Service' });
});

router.get('/healthcheck/ping', (req, res) => {
    res.status(200).json({ message: 'PONG' });
});

router.use('/auth', authRouter);
router.use('/users', userRouter);
router.use('/roles', roleRouter);
router.use('/permissions', permissionRouter);
router.use('/tenants', tenantRouter);
router.use('/branches', branchRouter);
router.use('/members', memberRouter);
router.use('/communities', communityRouter);
router.use('/analytics', analyticsRouter);

export const Router = router;
