import { Department, Prisma, PrismaClient } from '@prisma/client';
import { BaseRepository } from '../base.repository';

export class DepartmentRepository extends BaseRepository<
    Department,
    Prisma.DepartmentCreateInput,
    Prisma.DepartmentUpdateInput,
    Prisma.DepartmentWhereInput,
    Prisma.DepartmentWhereUniqueInput,
    Prisma.DepartmentOrderByWithRelationInput,
    Prisma.DepartmentDelegate
> {
    protected model: Prisma.DepartmentDelegate;

    constructor(prisma: PrismaClient) {
        super(prisma);
        this.model = prisma.department;
    }

    async findDepartmentsByBranch(branchId: string) {
        return this.model.findMany({ where: { branchId } });
    }
}
