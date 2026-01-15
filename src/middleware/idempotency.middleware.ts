import { TypedRequestBody } from '@/types/types';
import { NextFunction, Response } from 'express';
import onHeaders from 'on-headers';
import { v4 as uuidv4 } from 'uuid';
import logger from '../config/logger';
import redis from '../config/redis';

interface IdempotencyOptions {
    entityPrefix: string;
    ttlSeconds?: number;
}

export function idempotencyMiddleware(options: IdempotencyOptions) {
    const { entityPrefix, ttlSeconds = 600 } = options;

    return async (req: TypedRequestBody<unknown>, res: Response, next: NextFunction) => {
        const userId = req.user?.id;
        const idempotencyKey = (req.headers['idempotency-key'] as string) || uuidv4();

        if (!userId) {
            return next();
        }

        const cacheKey = `idempotency:${entityPrefix}:${userId}:${idempotencyKey}`;
        const cached = await redis.get(cacheKey);

        if (cached) {
            try {
                const data = JSON.parse(cached);
                logger.log(`Idempotency hit for key: ${cacheKey}`);
                return res.status(data.code || 200).json(data.body);
            } catch (err: unknown) {
                logger.error(`Failed to parse cached idempotent response: ${err}`);
            }
        }

        req.idempotencyKey = idempotencyKey;
        req.idempotencyCacheKey = cacheKey;

        const originalJson = res.json.bind(res);

        res.json = (body: unknown): Response => {
            if (res.statusCode < 400) {
                const dataToCache = {
                    code: res.statusCode,
                    body,
                };

                redis.set(cacheKey, JSON.stringify(dataToCache), 'EX', ttlSeconds).catch((err: unknown) => {
                    logger.error(`Failed to cache idempotent response for key ${cacheKey}: ${err}`);
                });
            }

            return originalJson(body);
        };

        onHeaders(res, () => {
            logger.log(`Handling request with idempotency key: ${idempotencyKey}`);
        });

        next();
    };
}
