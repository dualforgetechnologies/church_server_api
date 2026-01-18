import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';

import Logger from '@/config/logger';
import { UserService } from '@/service/user/user.service';
import { Controller } from '../controller';

import { CreateSuperAdminDto, CreateUserDto, SignupUserDto, UpdateUserDto } from '@/DTOs/user';
import { AppConfig } from '@/config/app-config';

export class UserController extends Controller {
    private readonly userService: UserService;
    private readonly logger: Logger;

    constructor() {
        super();

        const prisma = new PrismaClient();

        this.userService = new UserService(prisma);
        this.logger = new Logger('UserController', 'USER_CONTROLLER');
    }

    /**
     * Admin creates a new user
     */
    createUser = async (req: Request, res: Response) => {
        try {
            const payload = req.body as CreateUserDto;
            const tenantId = req?.tenantId;
            const result = await this.userService.createTenantUser(payload, tenantId);
            return this.response(res, result);
        } catch (error) {
            return this.error({
                res,
                error,
                logger: this.logger,
                message: 'Failed to create user',
            });
        }
    };

    /**
     * Bootstrap system super admin
     */
    createSuperAdmin = async (req: Request, res: Response) => {
        try {
            const superAdminSecret = req.headers?.super_admin_secret as string;

            if (!superAdminSecret || superAdminSecret !== AppConfig.secret.superAdminSecret) {
                return res.status(403).json({
                    success: false,
                    message: 'Unauthorized: Invalid or missing pass key',
                });
            }

            const payload = req.body as CreateSuperAdminDto;
            const result = await this.userService.createSuperAdmin(payload);
            return this.response(res, result);
        } catch (error) {
            return this.error({
                res,
                error,
                logger: this.logger,
                message: 'Failed to create super admin',
            });
        }
    };

    /**
     * Self-service user signup
     */
    signupUser = async (req: Request, res: Response) => {
        try {
            const payload = req.body as SignupUserDto;
            const tenantId = req?.tenantId;
            const result = await this.userService.signupUser(payload, tenantId);
            return this.response(res, result);
        } catch (error) {
            return this.error({
                res,
                error,
                logger: this.logger,
                message: 'Failed to signup user',
            });
        }
    };

    /**
     * Get user by ID
     */
    getUserById = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const result = await this.userService.findById(id);
            return this.response(res, result);
        } catch (error) {
            return this.error({
                res,
                error,
                logger: this.logger,
                message: 'Failed to fetch user',
            });
        }
    };

    /**
     * Update user profile & account info
     */
    updateUser = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const payload = req.body as UpdateUserDto;
            const result = await this.userService.updateUser(id, payload);
            return this.response(res, result);
        } catch (error) {
            return this.error({
                res,
                error,
                logger: this.logger,
                message: 'Failed to update user',
            });
        }
    };

    /**
     * Permanently delete user
     */
    deleteUser = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const result = await this.userService.deleteUser(id);
            return this.response(res, result);
        } catch (error) {
            return this.error({
                res,
                error,
                logger: this.logger,
                message: 'Failed to delete user',
            });
        }
    };
}

export const userController = new UserController();
