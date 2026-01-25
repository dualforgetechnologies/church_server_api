import { memberController } from '@/controllers/member/member.controller';
import { authJWT } from '@/middleware/auth.middleware';
import { tenantMiddleware } from '@/middleware/tenant.middleware';
import { validateBodyDto, validateQueryDto } from '@/middleware/validate-dto.middleware';
import express from 'express';

import { memberListQueryDto, updateMemberCommunityDto, updateMemberDto } from '@/DTOs/member';
import { roleBasedMiddleware } from '@/middleware/role-base.middleware';

const memberRouter = express.Router();

/**
 * Get member by ID (with optional branch filter)
 */
memberRouter.get('/:id', authJWT.authenticate, tenantMiddleware(), memberController.getTenantMemberById);

/**
 * Update member community memberships
 */

memberRouter.patch(
    '/:id/communities',
    authJWT.authenticate,
    tenantMiddleware(),
    roleBasedMiddleware(['TENANT_ADMIN']),
    validateBodyDto(updateMemberCommunityDto),
    memberController.updateMemberCommunity,
);

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
