import { ApiError } from '@/utils/errors/api.error';
import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import redis from '../config/redis';
import 'dotenv/config';

const redisEnabled = process.env.ENABLE_REDIS !== 'false';

interface RateLimitOptions {
    keyPrefix: string;
    windowSeconds: number;
    maxRequests: number;
}

export function rateLimitMiddleware(options: RateLimitOptions) {
    const { keyPrefix, windowSeconds, maxRequests } = options;

    return async (req: Request, _res: Response, next: NextFunction) => {
        const userId = req.user?.id;
        const identifier = userId || req.ip;

        if (!identifier) {
            return next();
        }

        if (redisEnabled) {
            const key = `${keyPrefix}:${userId}`;
            const current = await redis.incr(key);

            if (current === 1) {
                await redis.expire(key, windowSeconds);
            }

            if (current > maxRequests) {
                throw new ApiError(
                    StatusCodes.TOO_MANY_REQUESTS,
                    `Rate limit exceeded. Max ${maxRequests} requests every ${windowSeconds} seconds.`,
                );
            }
        }

        next();
    };
}
