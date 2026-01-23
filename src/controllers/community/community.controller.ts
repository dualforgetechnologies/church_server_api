import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';

import { CommunityListQueryDto, CreateCommunityDto, UpdateCommunityDto } from '@/DTOs/community/community.dto';
import Logger from '@/config/logger';
import { CommunityService } from '@/service/community/community.service';
import { Controller } from '../controller';

export class CommunityController extends Controller {
    private readonly communityService: CommunityService;
    private readonly logger: Logger;

    constructor() {
        super();

        const prisma = new PrismaClient();

        this.communityService = new CommunityService(prisma);
        this.logger = new Logger('CommunityController', 'COMMUNITY_CONTROLLER');
    }

    /**
     * Create a new community
     */
    createCommunity = async (req: Request, res: Response) => {
        try {
            const payload = req.body as CreateCommunityDto;
            const tenantId = req?.tenantId;
            const actingUserId = req?.user.id;

            if (!tenantId || !actingUserId) {
                return this.error({
                    res,
                    logger: this.logger,
                    message: 'Authenticated tenant and user context required',
                });
            }

            const result = await this.communityService.createCommunity(payload, req.tenant, actingUserId);
            return this.response(res, result);
        } catch (error) {
            return this.error({
                res,
                error,
                logger: this.logger,
                message: 'Failed to create community',
            });
        }
    };

    /**
     * Update community details
     */
    updateCommunity = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const payload = req.body as UpdateCommunityDto;
            const tenantId = req?.tenantId;

            const result = await this.communityService.updateCommunity(id, tenantId, payload);
            return this.response(res, result);
        } catch (error) {
            return this.error({
                res,
                error,
                logger: this.logger,
                message: 'Failed to update community',
            });
        }
    };

    /**
     * Get a community by ID
     */
    getCommunityById = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const includeMembers = req.query.includeMembers === 'true';
            const tenantId = req?.tenantId;

            const result = await this.communityService.getCommunityById(id, tenantId, includeMembers);
            return this.response(res, result);
        } catch (error) {
            return this.error({
                res,
                error,
                logger: this.logger,
                message: 'Failed to fetch community',
            });
        }
    };

    /**
     * List communities
     */
    listCommunities = async (req: Request, res: Response) => {
        try {
            const query = req.query as unknown as CommunityListQueryDto;
            const tenantId = req?.tenantId;

            const result = await this.communityService.listCommunities(query, tenantId);
            return this.response(res, result);
        } catch (error) {
            return this.error({
                res,
                error,
                logger: this.logger,
                message: 'Failed to retrieve communities',
            });
        }
    };

    /**
     * Archive a community
     */
    archiveCommunity = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const result = await this.communityService.archiveCommunity(id);
            return this.response(res, result);
        } catch (error) {
            return this.error({
                res,
                error,
                logger: this.logger,
                message: 'Failed to archive community',
            });
        }
    };

    /**
     * Delete a community
     */
    deleteCommunity = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const result = await this.communityService.deleteCommunity(id);
            return this.response(res, result);
        } catch (error) {
            return this.error({
                res,
                error,
                logger: this.logger,
                message: 'Failed to delete community',
            });
        }
    };
}

export const communityController = new CommunityController();
