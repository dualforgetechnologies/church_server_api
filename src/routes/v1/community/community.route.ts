import express from 'express';

import { authJWT } from '@/middleware/auth.middleware';
import { tenantMiddleware } from '@/middleware/tenant.middleware';
import { validateBodyDto, validateQueryDto } from '@/middleware/validate-dto.middleware';

import {
    communityListQueryDto,
    communityMembersListQueryDto,
    createCommunityDto,
    createCommunityMemberDto,
    updateCommunityDto,
    updateCommunityMemberDto,
} from '@/DTOs/community/community.dto';
import { communityController } from '@/controllers/community/community.controller';
import { communityMemberController } from '@/controllers/community/communityMember.controller';

const communityRouter = express.Router();

/**
 * Community routes
 */

// Create a new community
communityRouter.post(
    '/',
    authJWT.authenticate,
    tenantMiddleware(),
    validateBodyDto(createCommunityDto),
    communityController.createCommunity,
);

// Update community details
communityRouter.put(
    '/:id',
    authJWT.authenticate,
    tenantMiddleware(),
    validateBodyDto(updateCommunityDto),
    communityController.updateCommunity,
);

// Get community by ID
communityRouter.get('/:id', authJWT.authenticate, tenantMiddleware(), communityController.getCommunityById);

// List communities
communityRouter.get(
    '/',
    authJWT.authenticate,
    tenantMiddleware(),
    validateQueryDto(communityListQueryDto),
    communityController.listCommunities,
);

// Archive a community
communityRouter.post('/:id/archive', authJWT.authenticate, tenantMiddleware(), communityController.archiveCommunity);

// Delete a community
communityRouter.delete('/:id', authJWT.authenticate, tenantMiddleware(), communityController.deleteCommunity);

/**
 * Community members routes
 */

// Add a member to a community
communityRouter.post(
    '/members',
    authJWT.authenticate,
    tenantMiddleware(),
    validateBodyDto(createCommunityMemberDto),
    communityMemberController.addCommunityMembers,
);

// Update a community member
communityRouter.put(
    '/members/:communityId/:memberId',
    authJWT.authenticate,
    tenantMiddleware(),
    validateBodyDto(updateCommunityMemberDto),
    communityMemberController.updateCommunityMember,
);

// Get a community member by ID
communityRouter.get(
    '/members/:communityId/:memberId',
    authJWT.authenticate,
    tenantMiddleware(),
    communityMemberController.getCommunityMemberById,
);

// List community members
communityRouter.get(
    '/:communityId/members',
    authJWT.authenticate,
    tenantMiddleware(),
    validateQueryDto(communityMembersListQueryDto),
    communityMemberController.listCommunityMembers,
);

// Remove a member from a community
communityRouter.delete(
    '/members/:communityId/:memberId',
    authJWT.authenticate,
    tenantMiddleware(),
    communityMemberController.removeCommunityMember,
);

export default communityRouter;
