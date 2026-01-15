import { SubscriptionTier, TenantStatus } from '@prisma/client';
import { z } from 'zod';
import { commonPaginationQueryDto } from '../common';
import { createUserDto } from '../user';

export const zTenantStatus = z.nativeEnum(TenantStatus);
export const zSubscriptionTier = z.nativeEnum(SubscriptionTier);

export const baseTenantFields = {
    name: z.string().min(2),
    slug: z.string().min(2),
    email: z.string().email(),

    phone: z.string().optional(),
    logo: z.string().url().optional(),
    description: z.string().optional(),

    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().default('US'),

    timezone: z.string().default('UTC'),
    language: z.string().default('en'),
};

export const createTenantDto = z.object({
    ...baseTenantFields,

    currencyId: z.string().optional(),
    defaultCurrency: z.string().default('USD'),

    subscriptionTier: zSubscriptionTier.default(SubscriptionTier.BASIC),
    subscriptionExpiresAt: z.date().optional(),

    isBranchEnabled: z.boolean().default(true),
    status: zTenantStatus.default(TenantStatus.PENDING),
});

export const createTrialTenantDto = z.object({
    ...baseTenantFields,

    subscriptionTier: z.literal(SubscriptionTier.FREE),
    status: z.literal(TenantStatus.TRIAL),
    subscriptionExpiresAt: z.date(),
});

export const updateTenantDto = z.object({
    name: z.string().min(2).optional(),
    slug: z.string().min(2).optional(),
    email: z.string().email().optional(),

    phone: z.string().optional(),
    logo: z.string().url().optional(),
    description: z.string().optional(),

    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),

    timezone: z.string().optional(),
    language: z.string().optional(),

    currencyId: z.string().optional(),
    defaultCurrency: z.string().optional(),

    isBranchEnabled: z.boolean().optional(),
});

export const updateTenantSubscriptionDto = z.object({
    subscriptionTier: zSubscriptionTier,
    subscriptionExpiresAt: z.date().optional(),
});

export const extendTenantSubscriptionDto = z.object({
    subscriptionExpiresAt: z.date(),
});

export const updateTenantStatusDto = z.object({
    status: zTenantStatus,
});

export const suspendTenantDto = z.object({
    reason: z.string().min(3),
});

export const reactivateTenantDto = z.object({
    status: z.literal(TenantStatus.ACTIVE),
});

export const tenantListQueryDto = commonPaginationQueryDto.extend({
    status: zTenantStatus.optional(),
    subscriptionTier: zSubscriptionTier.optional(),
    country: z.string().optional(),
    email: z.string().optional(),
    sortBy: z.string().optional(),
});

export const tenantContextDto = z.object({
    tenantId: z.string(),
    tenantSlug: z.string(),
});

export const createTenantWithAdminDto = z.object({
    tenantData: createTenantDto,
    adminData: createUserDto,
});

export type CreateTenantWithAdminDto = z.infer<typeof createTenantWithAdminDto>;
export type CreateTrialTenantDto = z.infer<typeof createTrialTenantDto>;
export type CreateTenantDto = z.infer<typeof createTenantDto>;
export type UpdateTenantDto = z.infer<typeof updateTenantDto>;

export type ExtendTenantSubscriptionDto = z.infer<typeof extendTenantSubscriptionDto>;
export type UpdateTenantSubscriptionDto = z.infer<typeof updateTenantSubscriptionDto>;
export type ReactivateTenantDto = z.infer<typeof reactivateTenantDto>;

export type UpdateTenantStatusDto = z.infer<typeof updateTenantStatusDto>;
export type SuspendTenantDto = z.infer<typeof suspendTenantDto>;

export type TenantListQueryDto = z.infer<typeof tenantListQueryDto>;

export type TenantContextDto = z.infer<typeof tenantContextDto>;
