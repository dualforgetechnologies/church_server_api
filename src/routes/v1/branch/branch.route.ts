import express from 'express';

import { authJWT } from '@/middleware/auth.middleware';
import { tenantMiddleware } from '@/middleware/tenant.middleware';
import { validateBodyDto, validateQueryDto } from '@/middleware/validate-dto.middleware';

import {
    assignUserToBranchDto,
    branchListQueryDto,
    closeBranchDto,
    createBranchDto,
    createChildBranchDto,
    createPrimaryBranchDto,
    removeUserFromBranchDto,
    updateBranchDto,
    updateBranchHierarchyDto,
    updateBranchStatusDto,
} from '@/DTOs/tenant/branch.dto';
import { branchController } from '@/controllers/branch/branch.controller';

const branchRouter = express.Router();

/**
 * Create a branch
 */
branchRouter.post(
    '/',
    authJWT.authenticate,
    tenantMiddleware(),
    validateBodyDto(createBranchDto),
    branchController.createBranch,
);

/**
 * Create primary branch
 */
branchRouter.post(
    '/primary',
    authJWT.authenticate,
    tenantMiddleware(),
    validateBodyDto(createPrimaryBranchDto),
    branchController.createPrimaryBranch,
);

/**
 * Create child branch
 */
branchRouter.post(
    '/child',
    authJWT.authenticate,
    tenantMiddleware(),
    validateBodyDto(createChildBranchDto),
    branchController.createChildBranch,
);

/**
 * Update branch details
 */
branchRouter.put(
    '/:id',
    authJWT.authenticate,
    tenantMiddleware(),
    validateBodyDto(updateBranchDto),
    branchController.updateBranch,
);

/**
 * Update branch hierarchy
 */
branchRouter.put(
    '/:id/hierarchy',
    authJWT.authenticate,
    tenantMiddleware(),
    validateBodyDto(updateBranchHierarchyDto),
    branchController.updateBranchHierarchy,
);

/**
 * Update branch status
 */
branchRouter.put(
    '/:id/status',
    authJWT.authenticate,
    tenantMiddleware(),
    validateBodyDto(updateBranchStatusDto),
    branchController.updateBranchStatus,
);

/**
 * Close branch
 */
branchRouter.post(
    '/:id/close',
    authJWT.authenticate,
    tenantMiddleware(),
    validateBodyDto(closeBranchDto),
    branchController.closeBranch,
);

/**
 * Assign user to branch
 */
branchRouter.post(
    '/user/assign',
    authJWT.authenticate,
    tenantMiddleware(),
    validateBodyDto(assignUserToBranchDto),
    branchController.assignUserToBranch,
);

/**
 * Remove user from branch
 */
branchRouter.post(
    '/:branchId/user/remove',
    authJWT.authenticate,
    tenantMiddleware(),
    validateBodyDto(removeUserFromBranchDto),
    branchController.removeUserFromBranch,
);

/**
 * List branches
 */
branchRouter.get(
    '/',
    authJWT.authenticate,
    tenantMiddleware(),
    validateQueryDto(branchListQueryDto),
    branchController.listBranches,
);
/**
 * Get branch by ID
 */
branchRouter.get('/:id', authJWT.authenticate, tenantMiddleware(), branchController.getBranchById);

export default branchRouter;
