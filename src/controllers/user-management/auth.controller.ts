import { User } from '@prisma/client';
import { Request, Response } from 'express';

import Logger from '@/config/logger';
import { AuthService } from '@/service/user/auth.service';
import { Controller } from '../controller';

import { LoginDto, RefreshTokenDto, ResetPasswordDto } from '@/DTOs/auth';
import { ForgotPasswordDto } from '@/DTOs/auth/forget-password.dto';
import { VerifyAccountDto } from '@/DTOs/auth/verify-account.dto';
import { ChangePasswordDto } from '@/DTOs/user';

export class AuthController extends Controller {
    private readonly authService: AuthService;
    private readonly logger: Logger;

    constructor() {
        super();
        this.authService = new AuthService();
        this.logger = new Logger('AuthController', 'AUTH_CONTROLLER');
    }

    /**
     * User login
     */
    login = async (req: Request, res: Response) => {
        try {
            const payload = req.body as LoginDto;
            const result = await this.authService.login(payload, req);
            return this.response(res, result);
        } catch (error) {
            return this.error({
                res,
                error,
                logger: this.logger,
                message: 'Login failed',
            });
        }
    };

    /**
     * Refresh access token
     */
    refreshToken = async (req: Request, res: Response) => {
        try {
            const payload = req.body as RefreshTokenDto;
            const result = await this.authService.refreshToken(payload);
            return this.response(res, result);
        } catch (error) {
            return this.error({
                res,
                error,
                logger: this.logger,
                message: 'Failed to refresh token',
            });
        }
    };

    /**
     * Logout user
     */
    logout = async (req: Request, res: Response) => {
        try {
            const { refreshToken } = req.body as { refreshToken: string };
            const result = await this.authService.logout(refreshToken);
            return this.response(res, result);
        } catch (error) {
            return this.error({
                res,
                error,
                logger: this.logger,
                message: 'Logout failed',
            });
        }
    };

    /**
     * Request password reset
     */
    requestPasswordReset = async (req: Request, res: Response) => {
        try {
            const payload = req.body as ForgotPasswordDto;
            const result = await this.authService.requestPasswordReset(payload);
            return this.response(res, result);
        } catch (error) {
            return this.error({
                res,
                error,
                logger: this.logger,
                message: 'Failed to request password reset',
            });
        }
    };

    /**
     * Reset password
     */
    resetPassword = async (req: Request, res: Response) => {
        try {
            const payload = req.body as ResetPasswordDto;
            const result = await this.authService.resetPassword(payload);
            return this.response(res, result);
        } catch (error) {
            return this.error({
                res,
                error,
                logger: this.logger,
                message: 'Failed to reset password',
            });
        }
    };

    /**
     * Change password (authenticated user)
     */
    changePassword = async (req: Request, res: Response) => {
        try {
            const user = req.user as User;
            const payload = req.body as ChangePasswordDto;
            const result = await this.authService.changePassword(user, payload);
            return this.response(res, result);
        } catch (error) {
            return this.error({
                res,
                error,
                logger: this.logger,
                message: 'Failed to change password',
            });
        }
    };

    /**
     * Social login
     */
    socialLogin = async (req: Request, res: Response) => {
        try {
            const profile = req.user as Partial<User>;
            const result = await this.authService.socialLogin(profile, req);
            return this.response(res, result);
        } catch (error) {
            return this.error({
                res,
                error,
                logger: this.logger,
                message: 'Social login failed',
            });
        }
    };

    /**
     * Verify user account
     */
    verifyAccount = async (req: Request, res: Response) => {
        try {
            const payload = req.body as VerifyAccountDto;
            const result = await this.authService.verifyAccount(payload);
            return this.response(res, result);
        } catch (error) {
            return this.error({
                res,
                error,
                logger: this.logger,
                message: 'Account verification failed',
            });
        }
    };

    /**
     * Get authenticated user profile
     */
    getProfile = async (req: Request, res: Response) => {
        try {
            const user = req.user as User;
            const result = await this.authService.getProfile(user);
            return this.response(res, result);
        } catch (error) {
            return this.error({
                res,
                error,
                logger: this.logger,
                message: 'Failed to retrieve profile',
            });
        }
    };
}

export const authController = new AuthController();
