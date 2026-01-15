import Logger from '@/config/logger';
import redisClient, { redisEnabledFlag } from '@/config/redis';
import { CACHE_PREFIX } from './constants/api.constants';

const logger = new Logger('UTILS - CACHE::');

export const cacheKey = (orgId: string, metric: string, period: string, dateStr: string) =>
    `${process.env.NODE_ENV || 'dev'}:${CACHE_PREFIX}:${orgId}:${metric}:${period}:${dateStr}`;

export const getCache = async <T>(key: string): Promise<T | null> => {
    if (!redisEnabledFlag) {
        return null;
    }
    try {
        const raw = await redisClient.get(key);
        if (!raw) {
            return null;
        }
        return JSON.parse(raw) as T;
    } catch {
        return null;
    }
};

export const setCache = async (key: string, value: unknown, ttlSeconds?: number): Promise<void> => {
    if (!redisEnabledFlag) {
        return;
    }
    try {
        const v = JSON.stringify(value);
        if (ttlSeconds) {
            await redisClient.set(key, v, 'EX', ttlSeconds);
        } else {
            await redisClient.set(key, v);
        }
    } catch (err) {
        logger.error(`Set Cache not successful: ${(err as Error).message}`);
    }
};

export const delCache = async (key: string): Promise<void> => {
    if (!redisEnabledFlag) {
        return;
    }
    try {
        await redisClient.del(key);
    } catch (err) {
        logger.error(`Delete Cache not successful: ${(err as Error).message}`);
    }
};
