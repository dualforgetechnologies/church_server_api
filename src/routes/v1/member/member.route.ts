import { memberController } from '@/controllers/member/member.controller';
import { authJWT } from '@/middleware/auth.middleware';
import { tenantMiddleware } from '@/middleware/tenant.middleware';
import { validateBodyDto, validateQueryDto } from '@/middleware/validate-dto.middleware';
import express from 'express';

import { memberListQueryDto, updateMemberDto } from '@/DTOs/member';

const memberRouter = express.Router();

/**
 * Get member by ID (with optional branch filter)
 */
memberRouter.get('/:id', authJWT.authenticate, tenantMiddleware(), memberController.getTenantMemberById);

/**
 * Update member details
 */
memberRouter.put(
    '/:id',
    authJWT.authenticate,
    tenantMiddleware(),
    validateBodyDto(updateMemberDto),
    memberController.updateMember,
);

/**
 * List members
 */
memberRouter.get(
    '/',
    authJWT.authenticate,
    tenantMiddleware(),
    validateQueryDto(memberListQueryDto),
    memberController.listMembers,
);

export default memberRouter;
