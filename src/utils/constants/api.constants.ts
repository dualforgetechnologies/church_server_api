export const apiConstants = {
};

export const AGG_PERIODS = {
    DAILY: 'daily',
    WEEKLY: 'weekly',
    MONTHLY: 'monthly',
} as const;

export type AggPeriod = (typeof AGG_PERIODS)[keyof typeof AGG_PERIODS];

export const CACHE_TTLS: Record<AggPeriod, number> = {
    daily: 60 * 60 * 24 * 7,
    weekly: 60 * 60 * 24 * 30,
    monthly: 60 * 60 * 24 * 90,
};

export const CACHE_PREFIX = 'analytics:org';
