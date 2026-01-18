import { Prisma, PrismaClient, Tenant, User, UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { Request } from 'express';
import { StatusCodes } from 'http-status-codes';

import { LoginDto, RefreshTokenDto, ResetPasswordDto } from '@/DTOs/auth';
import { ForgotPasswordDto } from '@/DTOs/auth/forget-password.dto';
import { VerifyAccountDto } from '@/DTOs/auth/verify-account.dto';

import { ChangePasswordDto } from '@/DTOs/user';
import { AppConfig } from '@/config/app-config';
import Logger from '@/config/logger';
import { db } from '@/db/db';
import { TenantRepository } from '@/repository/tenant/tenant.repository';
import { UserRepository } from '@/repository/user.repository';
import { MailService } from '@/service/transports/email/mail.service';
import { JwtPayloadT, ResetPasswordJwtPayload, VerifyAccountJwtPayload } from '@/types/account';
import { AppResponse } from '@/types/types';
import { getExpiryDateFromNow } from '@/utils/common';
import { DEFAULT_CHURCH_LOGO } from '@/utils/constants/common';
import { JwtService } from '@/utils/jwtService';
import { sanitizeAccount } from '@/utils/sanitizers/account';
import { StringValue } from 'ms';
import { Service } from '../base/service.base';

export class AuthService extends Service {
    private readonly db: PrismaClient;
    private readonly jwtService: JwtService;
    private readonly mailService: MailService;
    private readonly userRepo: UserRepository;
    private readonly tenantRepo: TenantRepository;

    constructor() {
        super(new Logger('AuthService', 'AUTH_SERVICE'));
        this.db = db;
        this.jwtService = new JwtService();
        this.mailService = new MailService();
        this.userRepo = new UserRepository(db);
        this.tenantRepo = new TenantRepository(db);
    }

    // ------------------------------
    // User login
    // ------------------------------
    async login(dto: LoginDto, req: Request): Promise<AppResponse> {
        return this.run(async () => {
            const user = await this.userRepo.findFirst({ email: dto.email });
            if (!user) {
                return this.error('User account not found', StatusCodes.NOT_FOUND);
            }
            if (user.status !== UserStatus.ACTIVE) {
                return this.error('User account is not active', StatusCodes.UNAUTHORIZED);
            }
            const isValid = await bcrypt.compare(dto.password, user.passwordHash || '');
            if (!isValid) {
                return this.error('Invalid credentials', StatusCodes.UNAUTHORIZED);
            }

            await this.userRepo.update({ id: user.id }, { lastLogin: new Date(), lastLoginIp: req.ip });

            const tokens = await this.getAuthTokens({
                sub: user.id,
                email: user.email,
                type: 'USER',
            });

            return this.success({
                data: { user: sanitizeAccount(user), ...tokens },
                message: 'Login successful',
            });
        }, 'Login failed');
    }

    // ------------------------------
    // Generate auth tokens
    // ------------------------------
    private async getAuthTokens({ sub, email, type }: JwtPayloadT) {
        const accessToken = this.jwtService.generateAccessToken({
            sub,
            email,
            type,
        });
        const refreshToken = await this.jwtService.generateRefreshToken(sub, type);
        return { accessToken, refreshToken };
    }

    // ------------------------------
    // Refresh tokens
    // ------------------------------
    async refreshToken(dto: RefreshTokenDto): Promise<AppResponse> {
        return this.run(async () => {
            const user = await this.jwtService.verifyRefreshToken(dto.refreshToken);

            const accessToken = this.jwtService.generateAccessToken({
                sub: user.id,
                email: user.email,
                role: user.role,
                type: 'USER',
            });

            const refreshToken = await this.jwtService.rotateRefreshToken(dto.refreshToken, 'USER');

            return this.success({
                data: { accessToken, refreshToken },
                message: 'Token refreshed successfully',
            });
        }, 'Failed to refresh token');
    }

    // ------------------------------
    // Logout
    // ------------------------------
    async logout(refreshToken: string): Promise<AppResponse> {
        return this.run(async () => {
            await this.jwtService.revokeRefreshToken(refreshToken);
            return this.success({ message: 'Logged out successfully' });
        }, 'Logout failed');
    }

    async requestPasswordReset(dto: ForgotPasswordDto): Promise<AppResponse> {
        return this.run(async () => {
            let tenant: Tenant | null = null;
            const user = await this.userRepo.findFirst({ email: dto.email });

            if (!user) {
                return this.success({
                    message: 'Reset password instructions sent if the email is registered.',
                });
            }
            if (user?.tenantId) {
                tenant = await this.tenantRepo.findById({ id: user.tenantId });
            }
            const expiry = getExpiryDateFromNow(AppConfig.jwt.resetLinkExpiresIn as StringValue);
            const token = this.jwtService.generateAccessToken(
                { sub: user.id, email: user.email, hasForgotPass: true, type: 'USER' },
                expiry.duration,
            );

            await this.mailService.sendResetPasswordRequest({
                token,
                firstName: '',
                lastName: '',
                accountType: 'USER',
                expiryAt: expiry.humanReadable,
                to: user.email,
                organizationName: tenant?.name ?? '',
                logo: tenant?.logo ?? DEFAULT_CHURCH_LOGO,
            });

            return this.success({
                message: 'Reset password instructions sent if the email is registered.',
            });
        }, 'Failed to request password reset');
    }

    async resetPassword(dto: ResetPasswordDto): Promise<AppResponse> {
        return this.run(async () => {
            const decoded = this.jwtService.verifyAccessToken(dto.token) as ResetPasswordJwtPayload;
            if (!decoded?.email || !decoded.hasForgotPass) {
                return this.error('Invalid reset token', StatusCodes.UNAUTHORIZED);
            }
            const hashed = await bcrypt.hash(dto.newPassword, 10);
            await this.userRepo.update({ id: decoded.sub }, { passwordHash: hashed });

            return this.success({ message: 'Password reset successfully' });
        }, 'Failed to reset password');
    }

    async changePassword(user: User, dto: ChangePasswordDto): Promise<AppResponse> {
        return this.run(async () => {
            const isMatch = await bcrypt.compare(dto.oldPassword, user.passwordHash || '');
            if (!isMatch) {
                return this.error('Old password incorrect', StatusCodes.BAD_REQUEST);
            }

            const hashed = await bcrypt.hash(dto.newPassword, 10);
            await this.userRepo.update({ id: user.id }, { passwordHash: hashed });

            return this.success({ message: 'Password updated successfully' });
        }, 'Failed to change password');
    }

    async socialLogin(profile: Partial<User>, req: Request): Promise<AppResponse> {
        return this.run(async () => {
            const email = profile?.email;
            if (!email) {
                return this.error('Invalid social login request', StatusCodes.BAD_REQUEST);
            }

            const user = await this.userRepo.findFirst({ email });
            if (!user) {
                return this.error('User account not found', StatusCodes.NOT_FOUND);
            }
            if (user.status !== UserStatus.ACTIVE) {
                return this.error('User account is inactive', StatusCodes.UNAUTHORIZED);
            }
            if (user.role === UserRole.GUEST) {
                return this.error('Unauthorized: Must belong to an organization', StatusCodes.UNAUTHORIZED);
            }
            await this.userRepo.update({ id: user.id }, { lastLogin: new Date(), lastLoginIp: req.ip });

            const accessToken = this.jwtService.generateAccessToken({
                sub: user.id,
                email: user.email,
                type: 'USER',
            });
            const refreshToken = await this.jwtService.generateRefreshToken(user.id, 'USER');

            return this.success({
                message: 'Login successful',
                data: { user: sanitizeAccount(user), accessToken, refreshToken },
            });
        }, 'Social login failed');
    }

    async verifyAccount(dto: VerifyAccountDto): Promise<AppResponse> {
        return this.run(async () => {
            const decoded = this.jwtService.verifyAccessToken(dto.token) as VerifyAccountJwtPayload;
            const { email, isNew, type } = decoded;

            if (!email || !isNew || !type) {
                return this.error('Invalid or expired verification token.', StatusCodes.UNAUTHORIZED);
            }
            const user = await this.userRepo.findFirst({ email });
            if (!user) {
                return this.error('Account not found. Please register again.', StatusCodes.NOT_FOUND);
            }
            if (user.emailVerified) {
                return this.success({
                    data: sanitizeAccount(user),
                    message: 'Account is already verified.',
                });
            }

            const updatedUser = await this.userRepo.update(
                { id: user.id },
                { status: UserStatus.ACTIVE, emailVerified: new Date() },
            );

            return this.success({
                data: sanitizeAccount(updatedUser),
                message: 'Account activated successfully. Please log in.',
            });
        }, 'Account verification failed');
    }

    async getProfile(user: User): Promise<AppResponse> {
        return this.run(async () => {
            const existing = await this.userRepo.findById<Prisma.UserInclude>(
                { id: user.id },
                {
                    include: {
                        member: true,
                        tenant: true,
                        roleAssignments: {
                            include: {
                                role: {
                                    include: {
                                        permissions: {
                                            include: {
                                                permission: true,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            );

            if (!existing) {
                return this.error('User account not found', StatusCodes.NOT_FOUND);
            }
            if (existing.status !== UserStatus.ACTIVE) {
                return this.error('User account is not active', StatusCodes.UNAUTHORIZED);
            }
            return this.success({
                data: sanitizeAccount(existing),
                message: 'Profile retrieved successfully',
            });
        }, 'Failed to retrieve profile');
    }
}
