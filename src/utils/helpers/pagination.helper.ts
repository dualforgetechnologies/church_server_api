import { PaginatedMetaData } from '@/types/types';
import { Request } from 'express';

export interface PaginationOptions {
    page: number;
    limit: number;
    skip: number;
}

export class PaginationHelper {
    private readonly defaultLimit: number;
    private readonly maxLimit: number;

    constructor(defaultLimit = 20, maxLimit = 100) {
        this.defaultLimit = defaultLimit;
        this.maxLimit = maxLimit;
    }

    /**
     * Extract pagination options from request query
     */
    getOptions(req: Request): PaginationOptions {
        const page = Math.max(1, Number.parseInt(req.query.page as string) || 1);
        const limit = Math.min(
            Math.max(1, Number.parseInt(req.query.limit as string) || this.defaultLimit),
            this.maxLimit,
        );
        const skip = (page - 1) * limit;

        return { page, limit, skip };
    }

    /**
     * Return paginated meta data
     */
    metaData(total: number, page: number, limit: number): PaginatedMetaData {
        const totalPages = Math.ceil(total / limit);
        return {
            totalCount: total,
            page,
            limit,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
        };
    }
}
