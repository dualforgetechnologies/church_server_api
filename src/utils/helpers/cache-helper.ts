import Logger from '@/config/logger';
import Redis from 'ioredis';
import { safeJsonParse } from '../common';

export class CacheHelper {
    constructor(
        private readonly redis: Redis | null,
        private readonly logger: Logger,
    ) {}

    async get<T>(key: string): Promise<T | null> {
        if (!this.redis) {
            return null;
        }

        try {
            const data = await this.redis.get(key);

            return data ? (safeJsonParse(data) as T) : null;
        } catch (err) {
            this.logger.error(`Redis GET failed for key: ${key}`, err);
            return null;
        }
    }
    async set<T>(key: string, value: T, ttlSeconds = 300): Promise<void> {
        if (!this.redis) {
            return;
        }
        try {
            const payload = JSON.stringify(value);
            await this.redis.set(key, payload, 'EX', ttlSeconds);
        } catch (err) {
            this.logger.error(`Redis SET failed for key: ${key}`, err);
        }
    }

    async del(key: string): Promise<void> {
        if (!this.redis) {
            return;
        }

        try {
            await this.redis.del(key);
        } catch (err) {
            this.logger.error(`Redis DEL failed for key: ${key}`, err);
        }
    }

    async upsert<T>(key: string, ttlSeconds: number, callback: () => Promise<T>): Promise<T> {
        let cached: T | null = null;

        try {
            cached = await this.get<T>(key);
        } catch (err) {}

        if (cached) {
            return cached;
        }

        const value = await callback();
        if (value) {
            await this.set(key, value, ttlSeconds);
        }
        return value;
    }

    async expire(key: string, ttlSeconds: number): Promise<void> {
        if (!this.redis) {
            return;
        }
        try {
            await this.redis.expire(key, ttlSeconds);
        } catch (err) {
            this.logger.error(`Redis EXPIRE failed for key: ${key}`, err);
        }
    }
    buildKey(prefix: string, obj: object) {
        return `${prefix}:${JSON.stringify(obj)}`;
    }
}
