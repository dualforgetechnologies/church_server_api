import express from 'express';

import { authJWT } from '@/middleware/auth.middleware';
import { tenantMiddleware } from '@/middleware/tenant.middleware';
import { validateBodyDto, validateQueryDto } from '@/middleware/validate-dto.middleware';

import {
    createTenantDto,
    createTenantWithAdminDto,
    createTrialTenantDto,
    extendTenantSubscriptionDto,
    reactivateTenantDto,
    suspendTenantDto,
    tenantListQueryDto,
    updateTenantDto,
    updateTenantStatusDto,
    updateTenantSubscriptionDto,
} from '@/DTOs/tenant/tenant.dto';
import { tenantController } from '@/controllers/tenent';

const tenantRouter = express.Router();

/**
 * Create a new tenant
 */
tenantRouter.post('/', authJWT.authenticate, validateBodyDto(createTenantDto), tenantController.createTenant);

/**
 * Create a trial tenant
 */
tenantRouter.post(
    '/trial',
    authJWT.authenticate,
    validateBodyDto(createTrialTenantDto),
    tenantController.createTrialTenant,
);

/**
 * Create tenant with admin
 */
tenantRouter.post(
    '/with-admin',
    authJWT.authenticate,
    validateBodyDto(createTenantWithAdminDto),
    tenantController.createTenantWithAdmin,
);

/**
 * Get tenant by ID
 */
tenantRouter.get('/:id', authJWT.authenticate, tenantController.getTenantById);

/**
 * Update tenant details
 */
tenantRouter.put(
    '/:id',
    authJWT.authenticate,
    tenantMiddleware(),
    validateBodyDto(updateTenantDto),
    tenantController.updateTenant,
);

/**
 * Soft delete tenant
 */
tenantRouter.delete('/:id', authJWT.authenticate, tenantMiddleware(), tenantController.deleteTenant);

/**
 * Update tenant subscription
 */
tenantRouter.put(
    '/:id/subscription',
    authJWT.authenticate,
    tenantMiddleware(),
    validateBodyDto(updateTenantSubscriptionDto),
    tenantController.updateTenantSubscription,
);

/**
 * Extend tenant subscription
 */
tenantRouter.post(
    '/:id/subscription/extend',
    authJWT.authenticate,
    tenantMiddleware(),
    validateBodyDto(extendTenantSubscriptionDto),
    tenantController.extendTenantSubscription,
);

/**
 * Update tenant status
 */
tenantRouter.put(
    '/:id/status',
    authJWT.authenticate,
    tenantMiddleware(),
    validateBodyDto(updateTenantStatusDto),
    tenantController.updateTenantStatus,
);

/**
 * Suspend tenant
 */
tenantRouter.post(
    '/:id/suspend',
    authJWT.authenticate,
    tenantMiddleware(),
    validateBodyDto(suspendTenantDto),
    tenantController.suspendTenant,
);

/**
 * Reactivate tenant
 */
tenantRouter.post(
    '/:id/reactivate',
    authJWT.authenticate,
    tenantMiddleware(),
    validateBodyDto(reactivateTenantDto),
    tenantController.reactivateTenant,
);

/**
 * List tenants
 */
tenantRouter.get('/', authJWT.authenticate, validateQueryDto(tenantListQueryDto), tenantController.listTenants);

export default tenantRouter;
