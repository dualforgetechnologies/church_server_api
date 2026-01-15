import { ResponseHandler } from '@/utils/helpers/response.handler';
import { UserRole } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

/**
 * Middleware to enforce role-based access control.
 * Only allows users with one of the specified roles to proceed.
 *
 * @param allowedRoles - An array of allowed user roles.
 */
export const roleBasedMiddleware = (allowedRoles: UserRole[]) => (req: Request, res: Response, next: NextFunction) => {
    const response = new ResponseHandler(res);

    try {
        const user = req.user;

        if (!user) {
            return response.error({
                message: 'Access denied: user not authenticated',
                code: StatusCodes.UNAUTHORIZED,
                data: null,
                success: false,
            });
        }

        if (!allowedRoles.includes(user.role)) {
            return response.error({
                message: 'Access denied: insufficient permissions',
                code: StatusCodes.FORBIDDEN,
                data: null,
                success: false,
            });
        }

        return next();
    } catch (error) {
        logger.error(`Role middleware error: ${error}`);
        return response.error({
            message: 'Internal server error during role validation',
            code: StatusCodes.INTERNAL_SERVER_ERROR,
            data: null,
            success: false,
        });
    }
};
