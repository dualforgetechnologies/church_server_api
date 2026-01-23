import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';

import Logger from '@/config/logger';
import { MemberService } from '@/service/member/member.service';
import { Controller } from '../controller';

import { MemberListQueryDto, UpdateMemberDto } from '@/DTOs/member';

export class MemberController extends Controller {
    private readonly memberService: MemberService;
    private readonly logger: Logger;

    constructor() {
        super();

        const prisma = new PrismaClient();

        this.memberService = new MemberService(prisma);
        this.logger = new Logger('MemberController', 'MEMBER_CONTROLLER');
    }

    /**
     * Update member details
     */
    updateMember = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const payload = req.body as UpdateMemberDto;
            const result = await this.memberService.updateMember(id, payload,req.tenantId);
            return this.response(res, result);
        } catch (error) {
            return this.error({
                res,
                error,
                logger: this.logger,
                message: 'Failed to update member',
            });
        }
    };

    /**
     * Get church member by ID
     */
    getTenantMemberById = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { branchId } = req.query as { branchId: string };
            const tenantId = req?.tenantId;
            if (!tenantId) {
                return this.error({
                    res,
                    logger: this.logger,
                    message: 'Authenicated church context is required',
                });
            }
            const result = await this.memberService.getMemberById(id, {
                tenantId,
                ...(branchId && { branchId }),
            });
            return this.response(res, result);
        } catch (error) {
            return this.error({
                res,
                error,
                logger: this.logger,
                message: 'Failed to fetch member',
            });
        }
    };

    /**
     * List members
     */
    listMembers = async (req: Request, res: Response) => {
        try {
            const query = req.query as unknown as MemberListQueryDto;
            const result = await this.memberService.listMembers(query, req.tenantId);
            return this.response(res, result);
        } catch (error) {
            return this.error({
                res,
                error,
                logger: this.logger,
                message: 'Failed to retrieve members',
            });
        }
    };
}

export const memberController = new MemberController();
