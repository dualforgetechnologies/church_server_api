import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';

import {
    CommunityMembersListQueryDto,
    CreateCommunityMemberDto,
    UpdateCommunityMemberDto,
} from '@/DTOs/community/community.dto';
import Logger from '@/config/logger';
import { CommunityMemberService } from '@/service/community/communityMember.service';
import { Controller } from '../controller';

export class CommunityMemberController extends Controller {
    private readonly communityMemberService: CommunityMemberService;
    private readonly logger: Logger;

    constructor() {
        super();

        const prisma = new PrismaClient();

        this.communityMemberService = new CommunityMemberService(prisma);
        this.logger = new Logger('CommunityMemberController', 'COMMUNITY_MEMBER_CONTROLLER');
    }

    /**
     * Add a member to a community
     */
    addCommunityMembers = async (req: Request, res: Response) => {
        try {
            const payload = req.body as CreateCommunityMemberDto;
            const tenantId = req?.tenantId;

            if (!tenantId) {
                return this.error({
                    res,
                    logger: this.logger,
                    message: 'Authenticated tenant context required',
                });
            }

            const result = await this.communityMemberService.createCommunityMembers(payload, req.tenant);
            return this.response(res, result);
        } catch (error) {
            return this.error({
                res,
                error,
                logger: this.logger,
                message: 'Failed to add community member',
            });
        }
    };

    /**
     * Update a community member
     */
    updateCommunityMember = async (req: Request, res: Response) => {
        try {
            const { communityId, memberId } = req.params;
            const payload = req.body as UpdateCommunityMemberDto;
            const tenantId = req?.tenantId;

            if (!tenantId) {
                return this.error({
                    res,
                    logger: this.logger,
                    message: 'Authenticated tenant context required',
                });
            }

            const result = await this.communityMemberService.updateCommunityMember(
                communityId,
                memberId,
                tenantId,
                payload,
            );
            return this.response(res, result);
        } catch (error) {
            return this.error({
                res,
                error,
                logger: this.logger,
                message: 'Failed to update community member',
            });
        }
    };

    /**
     * Get a community member by ID
     */
    getCommunityMemberById = async (req: Request, res: Response) => {
        try {
            const { communityId, memberId } = req.params;
            const tenantId = req?.tenantId;

            if (!tenantId) {
                return this.error({
                    res,
                    logger: this.logger,
                    message: 'Authenticated tenant context required',
                });
            }

            const result = await this.communityMemberService.getCommunityMemberById(communityId, memberId, tenantId);
            return this.response(res, result);
        } catch (error) {
            return this.error({
                res,
                error,
                logger: this.logger,
                message: 'Failed to fetch community member',
            });
        }
    };

    /**
     * List community members
     */
    listCommunityMembers = async (req: Request, res: Response) => {
        try {
            const { communityId } = req.params;
            const query = req.query as unknown as CommunityMembersListQueryDto;
            const tenantId = req?.tenantId;

            if (!tenantId) {
                return this.error({
                    res,
                    logger: this.logger,
                    message: 'Authenticated tenant context required',
                });
            }

            const result = await this.communityMemberService.listCommunityMembers(tenantId, communityId, query);
            return this.response(res, result);
        } catch (error) {
            return this.error({
                res,
                error,
                logger: this.logger,
                message: 'Failed to retrieve community members',
            });
        }
    };

    /**
     * Remove a community member
     */
    removeCommunityMember = async (req: Request, res: Response) => {
        try {
            const { communityId, memberId } = req.params;
            const tenantId = req?.tenantId;

            if (!tenantId) {
                return this.error({
                    res,
                    logger: this.logger,
                    message: 'Authenticated tenant context required',
                });
            }

            const result = await this.communityMemberService.removeCommunityMember(communityId, memberId, tenantId);
            return this.response(res, result);
        } catch (error) {
            return this.error({
                res,
                error,
                logger: this.logger,
                message: 'Failed to remove community member',
            });
        }
    };
}

export const communityMemberController = new CommunityMemberController();
