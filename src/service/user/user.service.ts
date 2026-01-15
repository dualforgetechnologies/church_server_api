import { MemberStatus, MemberType, PrismaClient, UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { StatusCodes } from 'http-status-codes';

import { AppConfig } from '@/config/app-config';
import Logger from '@/config/logger';
import { MemberRepository } from '@/repository/member.repository';
import { UserRepository } from '@/repository/user.repository';
import { AppResponse } from '@/types/types';
import { getExpiryDateFromNow } from '@/utils/common';
import { generateTempKey } from '@/utils/generateTemKey';
import { JwtService } from '@/utils/jwtService';
import { sanitizeAccount } from '@/utils/sanitizers/account';
import { StringValue } from 'ms';
import { Service } from '../base/service.base';
import { MailService } from '../transports/email/mail.service';

import { CreateSuperAdminDto, CreateUserDto, SignupUserDto, UpdateUserDto } from '@/DTOs/user';


export class UserService extends Service {
    private userRepo: UserRepository;
    private memberRepo: MemberRepository;
    private mailService: MailService;
    private jwtService: JwtService;

    /**
     * Initializes the UserService with required repositories
     * and infrastructure services.
     *
     * @param prisma - Prisma client instance
     */
    constructor(prisma: PrismaClient) {
        super(new Logger('UserService', 'USER_CORE_SERVICE'));
        this.userRepo = new UserRepository(prisma);
        this.memberRepo = new MemberRepository(prisma);
        this.mailService = new MailService();
        this.jwtService = new JwtService();
    }

    /**
     * Creates a new user by an administrator.
     *
     * This operation:
     * - Validates email uniqueness
     * - Validates tenant existence (if provided)
     * - Creates both User and Member records atomically
     * - Generates a temporary password if none is supplied
     * - Sends credentials via email
     *
     * @param data - User creation payload
     * @returns Standardized application response
     */
    async createUser(data: CreateUserDto, tenantId: string): Promise<AppResponse> {
        return this.run(async () => {
            const { password, email, branchId,role,twoFactorEnabled, ...memberData } = data;

            const existingUser = await this.userRepo.findFirst({ email });
            if (existingUser) {
                return this.error('Email already in use', StatusCodes.CONFLICT);
            }

            if (tenantId) {
                const tenantExists = await this.userRepo.prisma.tenant.findUnique({
                    where: { id: tenantId },
                });
                if (!tenantExists) {
                    return this.error('Tenant not found', StatusCodes.BAD_REQUEST);
                }
            }

            const tempPassword = password ?? generateTempKey(email, '', 6);
            const passwordHash = await bcrypt.hash(tempPassword, 10);

            const userData = {
                email,
                passwordHash,
                role: role ?? UserRole.MEMBER,
                status: UserStatus.ACTIVE,
                twoFactorEnabled: data.twoFactorEnabled ?? false,
                ...(tenantId && { tenant: { connect: { id: tenantId } } }),
            };

            const memberPayload = {
                ...memberData,
                userId: '',
                tenantId: tenantId!,
                branchId,
                memberNumber: `M-${Date.now()}`,
                memberType: MemberType.MEMBER,
                memberStatus: MemberStatus.ACTIVE,
                email,
            };

            const user = await this.userRepo.prisma.$transaction(async (tx) => {
                const createdUser = await tx.user.create({ data: userData });
                memberPayload.userId = createdUser.id;
                await tx.member.create({ data: memberPayload });
                return createdUser;
            });

            await this.mailService.sendNewEmployeeCredentialsMail({
                to: user.email,
                email: user.email,
                temPassword: tempPassword,
                organizationName: 'UNKNOWN',
                role: user.role,
                firstName: memberData.firstName ?? '',
                lastName: memberData.lastName ?? '',
            });

            return this.success({
                data: sanitizeAccount(user),
                message: 'User created successfully',
                code: StatusCodes.CREATED,
            });
        }, 'Failed to create user');
    }

    /**
     * Creates the system Super Admin.
     *
     * This method enforces a singleton constraint:
     * only one super admin may exist in the system.
     *
     * @param data - Super admin credentials
     * @returns Standardized application response
     */
    async createSuperAdmin(data: CreateSuperAdminDto): Promise<AppResponse> {
        return this.run(async () => {
            const exists = await this.userRepo.findFirst({
                role: UserRole.SUPER_ADMIN,
            });

            if (exists) {
                return this.error('Super admin already exists', StatusCodes.CONFLICT);
            }

            const passwordHash = await bcrypt.hash(data.password, 10);

            const {password,...rest}=data
            const user = await this.userRepo.create({
                ...rest,
                passwordHash,
                role: UserRole.SUPER_ADMIN,
                status: UserStatus.ACTIVE,
            });

            return this.success({
                data: sanitizeAccount(user),
                message: 'Super admin created successfully',
                code: StatusCodes.CREATED,
            });
        }, 'Failed to create super admin');
    }

    /**
     * Registers a new user via self-service signup.
     *
     * Flow:
     * - Creates User and Member records
     * - Marks account as pending verification
     * - Generates verification JWT
     * - Sends activation email
     *
     * @param data - Signup payload
     * @returns Standardized application response
     */
    async signupUser(data: SignupUserDto, tenantId: string): Promise<AppResponse> {
        return this.run(async () => {
            const { password, email, branchId, ...memberData } = data;

            const exists = await this.userRepo.findFirst({ email });
            if (exists?.emailVerified) {
                return this.error('Email already in use', StatusCodes.CONFLICT);
            }

            const passwordHash = await bcrypt.hash(password, 10);

            const userData = {
                email,
                passwordHash,
                role: data.role ?? UserRole.MEMBER,
                status: UserStatus.PENDING,
                ...(tenantId && { tenant: { connect: { id: tenantId } } }),
            };

            const memberPayload = {
                ...memberData,
                userId: '',
                tenantId: tenantId!,
                branchId,
                memberNumber: `M-${Date.now()}`,
                memberType: MemberType.MEMBER,
                memberStatus: MemberStatus.ACTIVE,
                email,
            };

            const user = await this.userRepo.prisma.$transaction(async (tx) => {
                const createdUser = await tx.user.create({ data: userData });
                memberPayload.userId = createdUser.id;
                await tx.member.create({ data: memberPayload });
                return createdUser;
            });

            const expiryMeta = getExpiryDateFromNow(AppConfig.jwt.verifyAccountExpiresIn as StringValue);

            const token = this.jwtService.generateAccessToken(
                {
                    sub: user.id,
                    email: user.email,
                    role: user.role,
                    isNew: true,
                    type: 'USER',
                },
                expiryMeta.duration,
            );

            await this.mailService.activateNewAccountRequest({
                token,
                to: user.email,
                firstName: memberData.firstName ?? '',
                lastName: memberData.lastName ?? '',
                expiryAt: expiryMeta.humanReadable,
            });

            return this.success({
                data: sanitizeAccount(user),
                message: 'Signup successful, please verify your account',
                code: StatusCodes.CREATED,
            });
        }, 'Failed to signup user');
    }

    /**
     * Retrieves a user by ID with associated member and role data.
     *
     * @param id - User identifier
     * @returns Standardized application response
     */
    async findById(id: string): Promise<AppResponse> {
        return this.run(async () => {
            const user = await this.userRepo.findById({ id }, { include: { member: true, userRole: true } });

            if (!user) {
                return this.error('User not found', StatusCodes.NOT_FOUND);
            }

            return this.success({ data: sanitizeAccount(user) });
        }, 'Failed to fetch user');
    }

    /**
     * Updates user and member profile data atomically.
     *
     * @param id - User identifier
     * @param data - Update payload
     * @returns Standardized application response
     */
    async updateUser(id: string, data: UpdateUserDto): Promise<AppResponse> {
        return this.run(async () => {
            const { email, role, status, twoFactorEnabled, ...memberData } = data;

            const updatedUser = await this.userRepo.prisma.$transaction(async (tx) => {
                const userUpdate = await tx.user.update({
                    where: { id },
                    data: { email, role, status, twoFactorEnabled },
                });

                await tx.member.updateMany({
                    where: { userId: id },
                    data: memberData,
                });

                return userUpdate;
            });

            return this.success({
                data: sanitizeAccount(updatedUser),
                message: 'User updated successfully',
            });
        }, 'Failed to update user');
    }

    /**
     * Permanently deletes a user and all associated member records.
     *
     * @param id - User identifier
     * @returns Standardized application response
     */
    async deleteUser(id: string): Promise<AppResponse> {
        return this.run(async () => {
            await this.userRepo.prisma.$transaction(async (tx) => {
                await tx.member.deleteMany({ where: { userId: id } });
                await tx.user.delete({ where: { id } });
            });

            return this.success({ message: 'User deleted successfully' });
        }, 'Failed to delete user');
    }
}
