import { db } from '@/db/db';
import { ResponseHandler } from '@/utils/helpers/response.handler';
import { Tenant } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

declare global {
    namespace Express {
        interface Request {
            tenantId: string;
            tenant: Tenant;
        }
    }
}

interface TenantResolutionOptions {
    isPublicRequest?: boolean;
}
/**
 * Middleware for tenant (Tenant) resolution in a multi-tenant arch.
 */
export const tenantMiddleware = (options: TenantResolutionOptions = {}) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        const response = new ResponseHandler(res);
        const { isPublicRequest = false } = options;

        try {
            const Tenant = await resolveTenant(req, isPublicRequest);

            if (!Tenant) {
                return response.error({
                    message: 'church not found',
                    code: StatusCodes.NOT_FOUND,
                    data: null,
                    success: false,
                });
            }

            req.tenantId = Tenant.id;
            req.tenant = Tenant;

            return next();
        } catch (error) {
            console.error('[TenantMiddleware] Tenant resolution failed:', error);
            return response.error({
                message:
                    'Tenant scope access restriction. You must be a valid Tenant user. Failed to resolve Tenant context.',
                code: StatusCodes.UNAUTHORIZED,
                success: false,
            });
        }
    };
};

async function resolveTenant(req: Request, isPublicRequest: boolean): Promise<Tenant | null> {
    return isPublicRequest ? resolvePublicTenant(req) : resolveAuthenticatedTenant(req);
}
async function resolveAuthenticatedTenant(req: Request): Promise<Tenant | null> {
    const TenantId = req.user?.tenantId;
    if (!TenantId) {
        throw new Error('Authenticated requests require user Tenant context');
    }

    return db.tenant.findUnique({ where: { id: TenantId } });
}

async function resolvePublicTenant(req: Request): Promise<Tenant | null> {
    const TenantSlug = getTenantSlugFromRequest(req);
    if (!TenantSlug) {
        throw new Error('Tenant slug is required for public requests');
    }

    return db.tenant.findUnique({ where: { slug: TenantSlug } });
}

function getTenantSlugFromRequest(req: Request): string | undefined {
    const host = req.headers.host;
    const subdomain = host?.split('.')[0];
    const headerSlug = req.headers['x-Tenant-slug'] as string | undefined;
    const bodySlug = req.body?.TenantSlug;

    return headerSlug || bodySlug || subdomain;
}
