import {
  Member,
  MemberStatus,
  MemberType,
  Prisma,
  PrismaClient,
  Tenant,
  User,
  UserRole,
  UserStatus,
} from "@prisma/client";
import { StatusCodes } from "http-status-codes";
import * as bcrypt from "bcryptjs";

import Logger from "@/config/logger";
import { AppResponse } from "@/types/types";
import { Service } from "../base/service.base";

import {
  CreateTenantDto,
  CreateTrialTenantDto,
  ExtendTenantSubscriptionDto,
  ReactivateTenantDto,
  SuspendTenantDto,
  TenantListQueryDto,
  UpdateTenantDto,
  UpdateTenantStatusDto,
  UpdateTenantSubscriptionDto,
} from "@/DTOs/tenant/tenant.dto";
import { CreateUserDto } from "@/DTOs/user";
import { TenantRepository } from "@/repository/tenant/tenant.repository";
import { UserService } from "../user/user.service";
import { generateTempKey } from "@/utils/generateTemKey";
import { MailService } from "../transports/email/mail.service";

export class TenantService extends Service {
  private tenantRepo: TenantRepository;
  private userService: UserService;
  private mailService: MailService;

  constructor(prisma: PrismaClient) {
    super(new Logger("TenantService", "TENANT_CORE_SERVICE"));
    this.tenantRepo = new TenantRepository(prisma);
    this.userService = new UserService(prisma);
    this.mailService = new MailService();
  }

  /**
   * Ensure tenant fields (name, slug, email) are unique before create/update.
   *
   * @param data - Partial tenant data to check for uniqueness.
   * @param excludeId - Optional tenant ID to exclude from uniqueness check (useful on update).
   * @throws Error if any field already exists for a different tenant.
   */
  private async ensureUniqueTenantFields(
    data: Partial<{ name: string; slug: string; email: string }>,
    excludeId?: string
  ) {
    const { name, slug, email } = data;

    if (name) {
      const existingByName = await this.tenantRepo.findFirst({
        name,
        isDeleted: false,
        id: { not: excludeId },
      });
      if (existingByName) {
        throw new Error(`Tenant with name "${name}" already exists`);
      }
    }

    if (slug) {
      const existingBySlug = await this.tenantRepo.findFirst({
        slug,
        isDeleted: false,
        id: { not: excludeId },
      });
      if (existingBySlug) {
        throw new Error(`Tenant with slug "${slug}" already exists`);
      }
    }

    if (email) {
      const existingByEmail = await this.tenantRepo.findFirst({
        email,
        isDeleted: false,
        id: { not: excludeId },
      });
      if (existingByEmail) {
        throw new Error(`Tenant with email "${email}" already exists`);
      }
    }
  }

  /**
   * Create a new tenant.
   *
   * @param data - Tenant data to create.
   * @returns Standardized response containing the created tenant.
   */
  async createTenant(data: CreateTenantDto): Promise<AppResponse> {
    return this.run(async () => {
      await this.ensureUniqueTenantFields({
        name: data.name,
        slug: data.slug,
        email: data.email,
      });

      const tenant = await this.tenantRepo.create(data);
      return this.success({
        data: tenant,
        message: "Tenant created successfully",
      });
    }, "Failed to create tenant");
  }

  /**
   * Create a trial tenant (free tier).
   *
   * @param data - Trial tenant data.
   * @returns Standardized response containing the created trial tenant.
   */
  async createTrialTenant(data: CreateTrialTenantDto): Promise<AppResponse> {
    return this.run(async () => {
      const exists = await this.tenantRepo.findFirst({ email: data.email });
      if (exists) {
        return this.error(
          "Tenant with this email already exists",
          StatusCodes.CONFLICT
        );
      }

      const tenant = await this.tenantRepo.create(data);

      return this.success({
        data: tenant,
        message: "Trial tenant created successfully",
        code: StatusCodes.CREATED,
      });
    }, "Failed to create trial tenant");
  }

  /**
   * Find tenant by ID.
   *
   * @param id - Tenant ID.
   * @returns Standardized response containing the tenant data.
   */
  async findById(id: string): Promise<AppResponse> {
    return this.run(async () => {
      const tenant = await this.tenantRepo.findById({ id });
      if (!tenant) {
        return this.error("Tenant not found", StatusCodes.NOT_FOUND);
      }

      return this.success({ data: tenant });
    }, "Failed to fetch tenant");
  }

  /**
   * Update tenant data.
   *
   * @param id - Tenant ID.
   * @param data - Tenant fields to update.
   * @returns Standardized response containing updated tenant data.
   */
  async updateTenant(id: string, data: UpdateTenantDto): Promise<AppResponse> {
    return this.run(async () => {
      await this.ensureUniqueTenantFields(
        { name: data.name, slug: data.slug, email: data.email },
        id
      );

      const updated = await this.tenantRepo.update({ id }, data);
      return this.success({
        data: updated,
        message: "Tenant updated successfully",
      });
    }, "Failed to update tenant");
  }

  /**
   * Soft-delete a tenant.
   *
   * @param id - Tenant ID.
   * @param deletedById - User ID who performed the deletion.
   * @returns Standardized response containing deleted tenant data.
   */
  async deleteTenant(id: string, deletedById: string): Promise<AppResponse> {
    return this.run(async () => {
      const deleted = await this.tenantRepo.update(
        { id },
        {
          isDeleted: true,
          deletedById,
          deletedAt: new Date(),
        }
      );

      return this.success({
        data: deleted,
        message: "Tenant deleted successfully",
      });
    }, "Failed to delete tenant");
  }

  /**
   * Update tenant subscription details.
   *
   * @param id - Tenant ID.
   * @param data - Subscription update data.
   * @returns Standardized response containing updated tenant subscription.
   */
  async updateTenantSubscription(
    id: string,
    data: UpdateTenantSubscriptionDto
  ): Promise<AppResponse> {
    return this.run(async () => {
      const updated = await this.tenantRepo.update({ id }, data);

      return this.success({
        data: updated,
        message: "Tenant subscription updated successfully",
      });
    }, "Failed to update tenant subscription");
  }

  /**
   * Extend tenant subscription expiration date.
   *
   * @param id - Tenant ID.
   * @param data - New subscription expiry date.
   * @returns Standardized response containing updated tenant subscription.
   */
  async extendTenantSubscription(
    id: string,
    data: ExtendTenantSubscriptionDto
  ): Promise<AppResponse> {
    return this.run(async () => {
      const updated = await this.tenantRepo.update({ id }, data);

      return this.success({
        data: updated,
        message: "Tenant subscription extended successfully",
      });
    }, "Failed to extend tenant subscription");
  }

  /**
   * Update tenant status (ACTIVE, INACTIVE, etc.).
   *
   * @param id - Tenant ID.
   * @param data - New tenant status.
   * @returns Standardized response containing updated tenant status.
   */
  async updateTenantStatus(
    id: string,
    data: UpdateTenantStatusDto
  ): Promise<AppResponse> {
    return this.run(async () => {
      const updated = await this.tenantRepo.update({ id }, data);

      return this.success({
        data: updated,
        message: "Tenant status updated successfully",
      });
    }, "Failed to update tenant status");
  }

  /**
   * Suspend a tenant and optionally clear subscription.
   *
   * @param id - Tenant ID.
   * @param data - Reason for suspension.
   * @returns Standardized response containing suspended tenant.
   */
  async suspendTenant(
    id: string,
    data: SuspendTenantDto
  ): Promise<AppResponse> {
    return this.run(async () => {
      const updated = await this.tenantRepo.update(
        { id },
        {
          status: "SUSPENDED",
          subscriptionExpiresAt: null,
        }
      );

      return this.success({
        data: updated,
        message: `Tenant suspended: ${data.reason}`,
      });
    }, "Failed to suspend tenant");
  }

  /**
   * Reactivate a suspended tenant.
   *
   * @param id - Tenant ID.
   * @param data - Status to reactivate to (should be ACTIVE).
   * @returns Standardized response containing reactivated tenant.
   */
  async reactivateTenant(
    id: string,
    data: ReactivateTenantDto
  ): Promise<AppResponse> {
    return this.run(async () => {
      const updated = await this.tenantRepo.update(
        { id },
        { status: data.status }
      );

      return this.success({
        data: updated,
        message: "Tenant reactivated successfully",
      });
    }, "Failed to reactivate tenant");
  }

  /**
   * List tenants with optional filtering, sorting, and pagination.
   *
   * @param query - Query parameters including page, limit, filters, and sort options.
   * @returns Standardized response containing tenants and pagination metadata.
   */
  async listTenants(query: TenantListQueryDto): Promise<AppResponse> {
    return this.run(async () => {
      const {
        page = 1,
        limit = 20,
        sortBy = "createdAt",
        sortOrder = "desc",
        status,
        subscriptionTier,
        country,
        email,
        isDeleted = false,
      } = query;

      const where: Prisma.TenantWhereInput = {
        isDeleted,
        ...(status && { status }),
        ...(subscriptionTier && { subscriptionTier }),
        ...(country && { country }),
        ...(email && { email: { contains: email, mode: "insensitive" } }),
      };

      const orderBy: Prisma.Enumerable<Prisma.TenantOrderByWithRelationInput> =
        {
          [sortBy]: sortOrder,
        };

      const res = await this.tenantRepo.findAll(where, orderBy, {
        page,
        limit,
      });

      return this.success({
        data: res.data,
        pagination: res.pagination,
        message: "Tenants retrieved successfully",
      });
    }, "Failed to retrieve tenants");
  }

  async createTenantWithAdmin(
    tenantData: CreateTenantDto,
    adminData: CreateUserDto
  ): Promise<AppResponse> {
    return this.run(async () => {
      const prisma = this.tenantRepo.prisma;

      let tenant: Tenant | null = null;
      let user: User | null = null;
      let member: Member | null = null;

      try {
        const existingTenant = await prisma.tenant.findFirst({
          where: {
            OR: [
              { name: tenantData.name },
              { slug: tenantData.slug },
              { email: tenantData.email },
            ],
          },
        });

        if (existingTenant) {
          throw new Error(
            "Tenant with same name, slug, or email already exists"
          );
        }


        tenant = await prisma.tenant.create({
          data: tenantData,
        });

        const { password, email, branchId, twoFactorEnabled, role,...memberData } =
          adminData;

        const tempPassword: string = password ?? generateTempKey(email, "", 6);

        const passwordHash: string = await bcrypt.hash(tempPassword, 10);

 
        user = await prisma.user.create({
          data: {
            email,
            passwordHash,
            role: UserRole.TENANT_ADMIN,
            status: UserStatus.ACTIVE,
            twoFactorEnabled: twoFactorEnabled ?? false,
            tenantId: tenant.id,
          },
        });

   
        member = await prisma.member.create({
          data: {
            ...memberData,
            userId: user.id,
            tenantId: tenant.id,
            branchId,
            memberNumber: `M-${Date.now()}`,
            memberType: MemberType.MEMBER,
            memberStatus: MemberStatus.ACTIVE,
            email,
          },
        });

 
        await this.mailService.sendNewEmployeeCredentialsMail({
          to: email,
          email,
          temPassword: tempPassword,
          organizationName: tenant.name,
          role: UserRole.TENANT_ADMIN,
          firstName: memberData.firstName ?? "",
          lastName: memberData.lastName ?? "",
        });

        return this.success({
          data: { tenant, admin: user },
          message: "Tenant and tenant admin created successfully",
          code: 201,
        });
      } catch (error) {
        //  COMPENSATING ACTIONS (ROLLBACK)
        if (member) {
          await prisma.member
            .delete({ where: { id: member.id } })
            .catch(() => undefined);
        }

        if (user) {
          await prisma.user
            .delete({ where: { id: user.id } })
            .catch(() => undefined);
        }

        if (tenant) {
          await prisma.tenant
            .delete({ where: { id: tenant.id } })
            .catch(() => undefined);
        }

        return this.error(
          (error as Error).message || "Failed to create tenant with admin"
        );
      }
    }, "Failed to create tenant with admin");
  }
}
