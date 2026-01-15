import dotenv from 'dotenv';
// redis.ts
import Redis from 'ioredis';
import logger from './logger';

dotenv.config();

const redisEnabled = process.env.ENABLE_REDIS !== 'false';

// The real Redis instance (or null if disabled)
let realRedis: Redis | null = null;

// The exported client (real Redis or mock)
let redisClient:
    | Redis
    | {
          get(): Promise<null>;
          set(): Promise<void>;
          del(): Promise<void>;
          publish(): Promise<void>;
          incr(): Promise<number>;
          expire(): Promise<number>;
      };

if (redisEnabled) {
    const host = process.env.APP_REDIS_HOST || '127.0.0.1';
    const port = Number(process.env.APP_REDIS_PORT || '6379');

    realRedis = new Redis({
        host,
        port,
        retryStrategy: (times: number): number => {
            const delay = Math.min(times * 50, 2000);
            logger?.error?.(`Redis connection failed. Retrying in ${delay}ms...`);
            return delay;
        },
    });

    realRedis.on('connect', () => logger?.log?.('Connected to Redis successfully.'));
    realRedis.on('error', (err: Error) => logger?.error?.(`Redis error: ${err.message}`));
    realRedis.on('end', () => logger?.error?.('Redis connection lost.'));

    redisClient = realRedis;
} else {
    logger?.log?.('Redis is disabled. Using mock Redis client.');

    redisClient = {
        async get() {
            return null;
        },
        async set() {
            return undefined;
        },
        async del() {
            return undefined;
        },
        async publish() {
            return undefined;
        },
        async incr() {
            return 1;
        },
        async expire() {
            return 1;
        },
    };
}

export default redisClient; // general app code uses this
export const redisInstance = realRedis; // BullMQ uses this
export const redisEnabledFlag = redisEnabled;
