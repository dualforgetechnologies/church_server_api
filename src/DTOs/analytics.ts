import { z } from 'zod';

export const communityGrowthVelocityQueryDto = z.object({
    branchId: z.string().optional(),
    startDate: z
        .string()
        .optional()
        .refine((val) => !val || !Number.isNaN(Date.parse(val)), {
            message: 'startDate must be a valid date string',
        }),
    endDate: z
        .string()
        .optional()
        .refine((val) => !val || !Number.isNaN(Date.parse(val)), {
            message: 'endDate must be a valid date string',
        }),
    windowDays: z.preprocess((val) => (val === undefined ? undefined : Number(val)), z.number().positive().optional()),
});

export const communityGrowthVelocitySingleQueryDto = z.object({
    communityId: z.string({
        required_error: 'communityId is required',
    }),
    branchId: z.string().optional(),
    startDate: z
        .string()
        .optional()
        .refine((val) => !val || !Number.isNaN(Date.parse(val)), {
            message: 'startDate must be a valid date string',
        }),
    endDate: z
        .string()
        .optional()
        .refine((val) => !val || !Number.isNaN(Date.parse(val)), {
            message: 'endDate must be a valid date string',
        }),
    windowDays: z.preprocess((val) => (val === undefined ? undefined : Number(val)), z.number().positive().optional()),
});

export type CommunityGrowthVelocitySingleQuery = z.infer<typeof communityGrowthVelocitySingleQueryDto>;

export type CommunityGrowthVelocityQuery = z.infer<typeof communityGrowthVelocityQueryDto>;
