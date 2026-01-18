import { z } from 'zod';

const reqParamsIdDto = z.object({
    id: z.string().min(1),
});
/**
 * COMMON PAGINATED QUERY DTO
 */
const getPaginatedQueryDto = z.object({
    page: z
        .preprocess((val) => Number(val), z.number().int().min(1, { message: 'Page must be greater than 0' }))
        .optional()
        .default(1),

    limit: z
        .preprocess(
            (val) => Number(val),
            z.number().int().min(1).max(100, { message: 'Limit must be between 1 and 100' }),
        )
        .optional()
        .default(20),
});
const commonPaginationQueryDto = getPaginatedQueryDto.extend({
    isDeleted: z
        .preprocess((val) => {
            if (val === 'true' || val === '1' || val === 1) {
                return true;
            }
            if (val === 'false' || val === '0' || val === 0) {
                return false;
            }
            return val;
        }, z.boolean())
        .optional(),
    sortOrder: z
        .enum(['asc', 'desc'], {
            required_error: 'Sort order must be asc or desc',
        })
        .default('desc'),
    search: z.string().optional(),
    sortBy: z.string().optional(),
});
const paramOrgIdDto = z.object({
    organizationId: z.string().min(1),
});

const reqParamsCustomerIdDto = z.object({
    customerId: z.string().min(1),
});

type ReqParamsIdDto = z.infer<typeof reqParamsIdDto>;
type CommonPaginationQueryDto = z.infer<typeof commonPaginationQueryDto>;
type GetPaginatedQueryDto = z.infer<typeof getPaginatedQueryDto>;
type ParamOrgIdDto = z.infer<typeof paramOrgIdDto>;

type ReqParamsCustomerIdDto = z.infer<typeof reqParamsCustomerIdDto>;
export {
    reqParamsIdDto,
    getPaginatedQueryDto,
    paramOrgIdDto,
    commonPaginationQueryDto,
    reqParamsCustomerIdDto,
    type ReqParamsIdDto,
    type GetPaginatedQueryDto,
    type ParamOrgIdDto,
    type CommonPaginationQueryDto,
    type ReqParamsCustomerIdDto,
};

export const zodDate = (required = false) => {
    const base = z.preprocess(
        (val) => {
            if (typeof val === 'string' || val instanceof Date) {
                const date = new Date(val);
                return Number.isNaN(date.getTime()) ? undefined : date;
            }
            return val;
        },
        z.coerce.date({ required_error: 'Date is required' }),
    );

    return required ? base : base.optional();
};
