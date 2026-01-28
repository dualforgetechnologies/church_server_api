import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';

import Logger from '@/config/logger';
import { TenantService } from '@/service/tenant/tenant.service';
import { Controller } from '../controller';

import {
    CreateTenantDto,
    CreateTenantWithAdminDto,
    CreateTrialTenantDto,
    ExtendTenantSubscriptionDto,
    ReactivateTenantDto,
    SuspendTenantDto,
    TenantListQueryDto,
    UpdateTenantDto,
    UpdateTenantStatusDto,
    UpdateTenantSubscriptionDto,
} from '@/DTOs/tenant/tenant.dto';

export class TenantController extends Controller {
    private readonly tenantService: TenantService;
    private readonly logger: Logger;

    constructor() {
        super();

        const prisma = new PrismaClient();

        this.tenantService = new TenantService(prisma);
        this.logger = new Logger('TenantController', 'TENANT_CONTROLLER');
    }

    /**
     * Create a new tenant
     */
    createTenant = async (req: Request, res: Response) => {
        try {
            const payload = req.body as CreateTenantDto;
            const result = await this.tenantService.createTenant(payload);
            return this.response(res, result);
        } catch (error) {
            return this.error({
                res,
                error,
                logger: this.logger,
                message: 'Failed to create tenant',
            });
        }
    };

    /**
     * Create a trial tenant
     */
    createTrialTenant = async (req: Request, res: Response) => {
        try {
            const payload = req.body as CreateTrialTenantDto;
            const result = await this.tenantService.createTrialTenant(payload);
            return this.response(res, result);
        } catch (error) {
            return this.error({
                res,
                error,
                logger: this.logger,
                message: 'Failed to create trial tenant',
            });
        }
    };

    /** Create tenant with admin */
    createTenantWithAdmin = async (req: Request, res: Response) => {
        try {
            const { tenantData, adminData } = req.body as CreateTenantWithAdminDto;

            const result = await this.tenantService.createTenantWithAdmin(tenantData, adminData);
            return this.response(res, result);
        } catch (error) {
            return this.error({
                res,
                error,
                logger: this.logger,
                message: 'Failed to create tenant with admin',
            });
        }
    };
    /**
     * Get tenant by ID
     */
    getTenantById = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const result = await this.tenantService.getTenantById(id);
            return this.response(res, result);
        } catch (error) {
            return this.error({
                res,
                error,
                logger: this.logger,
                message: 'Failed to fetch tenant',
            });
        }
    };

    /**
     * Update tenant details
     */
    updateTenant = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const payload = req.body as UpdateTenantDto;
            const result = await this.tenantService.updateTenant(id, payload);
            return this.response(res, result);
        } catch (error) {
            return this.error({
                res,
                error,
                logger: this.logger,
                message: 'Failed to update tenant',
            });
        }
    };

    /**
     * Soft delete tenant
     */
    deleteTenant = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const deletedById = req.user?.id;
            const result = await this.tenantService.deleteTenant(id, deletedById);
            return this.response(res, result);
        } catch (error) {
            return this.error({
                res,
                error,
                logger: this.logger,
                message: 'Failed to delete tenant',
            });
        }
    };

    /**
     * Update tenant subscription
     */
    updateTenantSubscription = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const payload = req.body as UpdateTenantSubscriptionDto;
            const result = await this.tenantService.updateTenantSubscription(id, payload);
            return this.response(res, result);
        } catch (error) {
            return this.error({
                res,
                error,
                logger: this.logger,
                message: 'Failed to update tenant subscription',
            });
        }
    };

    /**
     * Extend tenant subscription
     */
    extendTenantSubscription = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const payload = req.body as ExtendTenantSubscriptionDto;
            const result = await this.tenantService.extendTenantSubscription(id, payload);
            return this.response(res, result);
        } catch (error) {
            return this.error({
                res,
                error,
                logger: this.logger,
                message: 'Failed to extend tenant subscription',
            });
        }
    };

    /**
     * Update tenant status
     */
    updateTenantStatus = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const payload = req.body as UpdateTenantStatusDto;
            const result = await this.tenantService.updateTenantStatus(id, payload);
            return this.response(res, result);
        } catch (error) {
            return this.error({
                res,
                error,
                logger: this.logger,
                message: 'Failed to update tenant status',
            });
        }
    };

    /**
     * Suspend tenant
     */
    suspendTenant = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const payload = req.body as SuspendTenantDto;
            const result = await this.tenantService.suspendTenant(id, payload);
            return this.response(res, result);
        } catch (error) {
            return this.error({
                res,
                error,
                logger: this.logger,
                message: 'Failed to suspend tenant',
            });
        }
    };

    /**
     * Reactivate tenant
     */
    reactivateTenant = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const payload = req.body as ReactivateTenantDto;
            const result = await this.tenantService.reactivateTenant(id, payload);
            return this.response(res, result);
        } catch (error) {
            return this.error({
                res,
                error,
                logger: this.logger,
                message: 'Failed to reactivate tenant',
            });
        }
    };

    /**
     * List tenants
     */
    listTenants = async (req: Request, res: Response) => {
        try {
            const query = req.query as unknown as TenantListQueryDto;
            const result = await this.tenantService.listTenants(query);
            return this.response(res, result);
        } catch (error) {
            return this.error({
                res,
                error,
                logger: this.logger,
                message: 'Failed to retrieve tenants',
            });
        }
    };
}

export const tenantController = new TenantController();
