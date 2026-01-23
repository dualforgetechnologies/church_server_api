import { PrismaClient } from '@prisma/client';

export abstract class BaseRepository<
    TModel,
    TCreateInput,
    TUpdateInput,
    TWhereInput,
    TWhereUniqueInput,
    TOrderByInput,
    TDelegate extends {
        findFirst: (args: {
            where?: TWhereInput;
            orderBy?: TOrderByInput;
        }) => Promise<TModel | null>;
        findMany: (args: {
            where?: TWhereInput;
            orderBy?: TOrderByInput;
            skip?: number;
            take?: number;
        }) => Promise<TModel[]>;
        create: (args: { data: TCreateInput }) => Promise<TModel>;
        update: (args: {
            where: TWhereUniqueInput;
            data: TUpdateInput;
        }) => Promise<TModel>;
        delete: (args: { where: TWhereUniqueInput }) => Promise<TModel>;
        count: (args: { where?: TWhereInput }) => Promise<number>;
    },
> {
    public prisma: PrismaClient;
    protected abstract model: TDelegate;

    constructor(prisma: PrismaClient) {
        this.prisma = prisma;
    }

    async create(data: TCreateInput): Promise<TModel> {
        return this.model.create({ data });
    }

    async update(where: TWhereUniqueInput, data: TUpdateInput): Promise<TModel> {
        return this.model.update({ where, data });
    }

    async findById<TInclude = undefined, TSelect = undefined>(
        where: TWhereUniqueInput,
        options?: {
            include?: TInclude;
            select?: TSelect;
        },
    ): Promise<TModel | null> {
        const query = { where } as Record<string, unknown>;
        if (options?.include) {
            query.include = options.include;
        }
        if (options?.select) {
            query.select = options.select;
        }

        return this.model.findFirst(query);
    }
    async findFirst<TInclude = undefined, TSelect = undefined>(
        where?: TWhereInput,
        orderBy?: TOrderByInput,
        options?: { include?: TInclude; select?: TSelect },
    ): Promise<TModel | null> {
        return this.model.findFirst({
            where,
            orderBy,
            ...(options?.include && { include: options.include }),
            ...(options?.select && { select: options.select }),
        });
    }

    async exists(where: TWhereInput): Promise<boolean> {
        const count = await this.model.count({ where });
        return count > 0;
    }

    async findAll<TInclude = undefined, TSelect = undefined>(
        filters?: TWhereInput,
        orderBy?: TOrderByInput,
        pagination?: { page?: number; limit?: number },
        options?: { include?: TInclude; select?: TSelect },
    ) {
        const page = Math.max(1, pagination?.page ?? 1);
        const limit = Math.max(1, pagination?.limit ?? 10);
        const skip = (page - 1) * limit;

        const [data, totalCount] = await this.prisma.$transaction(async () => {
            const data = await this.model.findMany({
                ...(filters && { where: filters }),
                ...(orderBy && { orderBy }),
                skip,
                take: limit,
                ...(options?.include && { include: options.include }),
                ...(options?.select && { select: options.select }),
            });

            const count = await this.model.count({ where: filters });
            return [data, count] as const;
        });

        const totalPages = Math.ceil(totalCount / limit);

        return {
            data,
            pagination: {
                totalCount,
                page,
                limit,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            },
        };
    }

    async getAll<TInclude = undefined, TSelect = undefined>(
        where?: TWhereInput,
        options?: { include?: TInclude; select?: TSelect },
        orderBy?: TOrderByInput,
    ): Promise<TModel[]> {
        return this.model.findMany({
            ...(where && { where }),
            ...(orderBy && { orderBy }),
            ...(options?.include && { include: options.include }),
            ...(options?.select && { select: options.select }),
        });
    }

    async delete(where: TWhereUniqueInput): Promise<TModel> {
        return this.model.delete({ where });
    }
    async count(where?: TWhereInput): Promise<number> {
        return this.model.count({ where });
    }
}
