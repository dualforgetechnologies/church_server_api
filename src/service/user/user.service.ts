import {
    Community,
    Member,
    MemberStatus,
    MemberType,
    PrismaClient,
    ProfessionType,
    Tenant,
    User,
    UserRole,
    UserStatus,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { StatusCodes } from 'http-status-codes';

import { AppConfig } from '@/config/app-config';
import Logger from '@/config/logger';
import { MemberRepository } from '@/repository/member.repository';
import { UserRepository } from '@/repository/user.repository';
import { AppResponse } from '@/types/types';
import { getExpiryDateFromNow, toMonthString } from '@/utils/common';
import { generateTempKey } from '@/utils/generateTemKey';
import { JwtService } from '@/utils/jwtService';
import { sanitizeAccount } from '@/utils/sanitizers/account';
import { StringValue } from 'ms';
import { Service } from '../base/service.base';
import { MailService } from '../transports/email/mail.service';

import { CreateSuperAdminDto, CreateUserDto, SignupUserDto, UpdateUserDto } from '@/DTOs/user';
import { CommunityRepository } from '@/repository/community/community.repository';
import { RoleRepository, UserRoleAssignmentRepository } from '@/repository/role.repository';
import { CommunityMemberService } from '../community/communityMember.service';

export class UserService extends Service {
    private userRepo: UserRepository;
    private memberRepo: MemberRepository;
    private mailService: MailService;
    private jwtService: JwtService;
    private userRoleRepo: UserRoleAssignmentRepository;
    private roleRepo: RoleRepository;
    private communityRepo: CommunityRepository;
    private communityMemberService: CommunityMemberService;

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
        this.userRoleRepo = new UserRoleAssignmentRepository(this.prisma);
        this.roleRepo = new RoleRepository(this.prisma);
        this.communityRepo = new CommunityRepository(prisma);
        this.communityMemberService = new CommunityMemberService(prisma);
    }

    /**
     * Creates a new user under a church by an administrator.
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

    async createTenantUser(
        data: CreateUserDto,
        tenantId: string,
        tenant: Tenant,
        actingUserId: string,
    ): Promise<AppResponse> {
        return this.run(async () => {
            const {
                password,
                email,
                branchId,
                role,
                twoFactorEnabled,

                roleId,
                roleExpiresAt,

                ...memberData
            } = data;
            const prisma = this.userRepo.prisma;

            let user: User | null = null;
            let member: Member | null = null;
            let userRoleId: string | null = null;

            try {
                const existingUser = await this.userRepo.findFirst({ email });
                if (existingUser) {
                    throw new Error('Email already in use');
                }

                const tenantExists = await prisma.tenant.findUnique({
                    where: { id: tenantId },
                });
                if (!tenantExists) {
                    throw new Error('Tenant not found');
                }

                const tempPassword = generateTempKey(email, '', 6);
                const passwordHash = await bcrypt.hash(tempPassword, 10);

                user = await this.userRepo.create({
                    email,
                    passwordHash,
                    role: role ?? UserRole.MEMBER,
                    status: UserStatus.ACTIVE,
                    twoFactorEnabled: twoFactorEnabled ?? false,
                    ...(tenantId && { tenant: { connect: { id: tenantId } } }),
                });

                member = await this.memberRepo.create({
                    ...memberData,
                    user: { connect: { id: user.id } },
                    tenant: { connect: { id: tenantId! } },
                    ...(branchId && { branch: { connect: { id: branchId } } }),
                    memberNumber: `M-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
                    memberType: MemberType.MEMBER,
                    memberStatus: MemberStatus.ACTIVE,
                    email,
                });

                if (roleId) {
                    const roleExists = await this.roleRepo.findById({
                        id: roleId,
                        tenantId,
                    });

                    if (!roleExists) {
                        throw new Error(`No role found with id ${roleId}`);
                    }

                    const userRole = await this.userRoleRepo.create({
                        role: { connect: { id: roleId } },
                        user: { connect: { id: user.id } },
                        assignedBy: actingUserId,
                        expiresAt: roleExpiresAt,
                    });

                    userRoleId = userRole.id;
                }

                // Update user with member relation
                await this.userRepo.update({ id: user.id }, { member: { connect: { id: member.id } } });

                // Send credentials email
                await this.mailService.sendNewMemberCredentialsMail({
                    to: email,
                    email,
                    temPassword: tempPassword,
                    organizationName: tenantExists.name,
                    role: user.role,
                    firstName: memberData.firstName ?? '',
                    lastName: memberData.lastName ?? '',
                    logo: tenantExists.logo ?? '',
                });

                // sync community
                try {
                    this.syncCommunity(data, member, tenant, data.branchId);
                } catch (error) {}

                return this.success({
                    data: sanitizeAccount(user),
                    message: 'User created successfully',
                    code: 201,
                });
            } catch (error) {
                // COMPENSATING ACTIONS (ROLLBACK)
                if (member) {
                    await prisma.member.delete({ where: { id: member.id } }).catch(() => undefined);
                }
                if (user) {
                    await prisma.user.delete({ where: { id: user.id } }).catch(() => undefined);
                }

                return this.error((error as Error).message || 'Failed to create user');
            }
        }, 'Failed to create user');
    }

    async syncCommunity(data: Partial<CreateUserDto>, member: Member, tenant: Tenant, branchId?: string) {
        const { address, dateOfBirth, profession, gender } = data;

        if (!address && !dateOfBirth && !profession && !gender) {
            return this.success({
                message: 'No community-relevant data provided, sync skipped',
            });
        }

        return this.run(async () => {
            // Helper to attach member to a community safely
            const attachToCommunity = async (community: Community | null) => {
                if (!community) {
                    return;
                }
                try {
                    await this.communityMemberService.createCommunityMembers(
                        {
                            communityId: community.id,
                            membersIds: [member.id],
                            status: 'ACTIVE',
                            role: 'MEMBER',
                        },
                        tenant,
                    );
                } catch (err) {
                    console.error('Failed to attach member to community:', err);
                }
            };

            // 1 CELL community
            if (address) {
                const cellCommunity = await this.communityRepo.findFirst({
                    tenantId: tenant.id,
                    ...(branchId && { branchId }),
                    location: address,
                    type: 'CELL',
                });
                await attachToCommunity(cellCommunity);
            }

            // 2️ TRIBE community (based on birth month)
            if (dateOfBirth) {
                const birthMonth = toMonthString(dateOfBirth); // returns 'JANUARY', 'FEBRUARY', etc
                if (birthMonth) {
                    const tribeCommunity = await this.communityRepo.findFirst({
                        tenantId: tenant.id,
                        ...(branchId && { branchId }),
                        month: birthMonth,
                        type: 'TRIBE',
                    });
                    await attachToCommunity(tribeCommunity);
                }
            }

            // 3️ PROFESSION community
            if (profession) {
                const professionCommunity = await this.communityRepo.findFirst({
                    tenantId: tenant.id,
                    ...(branchId && { branchId }),
                    profession: profession as ProfessionType,
                    type: 'PROFESSION',
                });
                await attachToCommunity(professionCommunity);
            }

            // 4️ MINISTRY community (based on gender)
            if (gender) {
                const ministryCommunity = await this.communityRepo.findFirst({
                    tenantId: tenant.id,
                    ...(branchId && { branchId }),
                    gender,
                    type: 'MINISTRY',
                });
                await attachToCommunity(ministryCommunity);
            }

            return this.success({
                message: 'Member successfully synced to applicable communities',
            });
        }, 'Failed to sync member to community');
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

            const { password, ...rest } = data;
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
    async signupUser(data: SignupUserDto, tenantId: string, tenant: Tenant): Promise<AppResponse> {
        return this.run(async () => {
            const prisma = this.userRepo.prisma;

            let user: User | null = null;
            let member: Member | null = null;

            try {
                const { password, email, branchId, ...memberData } = data;

                // Check if user already exists
                const existingUser = await this.userRepo.findFirst({ email });
                if (existingUser?.emailVerified) {
                    throw new Error('Email already in use');
                }

                // Verify tenant exists
                const tenantExists = await prisma.tenant.findUnique({
                    where: { id: tenantId },
                });
                if (!tenantExists) {
                    throw new Error('Tenant not found');
                }

                const passwordHash: string = await bcrypt.hash(password, 10);

                // Create user
                user = await this.userRepo.create({
                    email,
                    passwordHash,
                    role: data.role ?? UserRole.MEMBER,
                    status: UserStatus.PENDING,
                    tenant: {
                        connect: { id: tenantId },
                    },
                });

                // Create member
                member = await this.memberRepo.create({
                    ...memberData,
                    user: { connect: { id: user.id } },
                    tenant: { connect: { id: tenantId } },
                    ...(branchId && { branch: { connect: { id: branchId } } }),
                    memberNumber: `M-${Date.now()}`,
                    memberType: MemberType.MEMBER,
                    memberStatus: MemberStatus.ACTIVE,
                    email,
                });

                // Link member to user
                if (member?.id) {
                    await this.userRepo.update({ id: user.id }, { member: { connect: { id: member.id } } });
                }

                // Send account verification email
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
                    logo: tenantExists.logo ?? '',
                    organizationName: tenantExists.name,
                });

                // sync community
                try {
                    this.syncCommunity(data, member, tenant, data.branchId);
                } catch (error) {}

                return this.success({
                    data: { user, member, tenant: tenantExists },
                    message: 'Signup successful, please verify your account',
                    code: 201,
                });
            } catch (error) {
                // COMPENSATING ACTIONS (ROLLBACK)
                if (member) {
                    await prisma.member.delete({ where: { id: member.id } }).catch(() => undefined);
                }
                if (user) {
                    await prisma.user.delete({ where: { id: user.id } }).catch(() => undefined);
                }

                return this.error((error as Error).message || 'Failed to signup user');
            }
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
