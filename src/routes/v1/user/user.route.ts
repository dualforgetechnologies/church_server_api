import { createSuperAdminDto, createUserDto, signupUserDto, updateUserDto } from '@/DTOs/user';
import { userController } from '@/controllers/user-management/user.controller';
import { authJWT } from '@/middleware/auth.middleware';
import { tenantMiddleware } from '@/middleware/tenant.middleware';
import { validateBodyDto } from '@/middleware/validate-dto.middleware';
import express from 'express';

const userRouter = express.Router();

userRouter.post(
    '/',
    authJWT.authenticate,
    tenantMiddleware(),
    validateBodyDto(createUserDto),
    userController.createUser,
);

userRouter.post('/super-admin', validateBodyDto(createSuperAdminDto), userController.createSuperAdmin);

userRouter.post('/signup', validateBodyDto(signupUserDto), userController.signupUser);
userRouter.get('/:id', authJWT.authenticate, userController.getUserById);

userRouter.put(
    '/:id',
    authJWT.authenticate,
    tenantMiddleware(),
    validateBodyDto(updateUserDto),
    userController.updateUser,
);

userRouter.delete('/:id', authJWT.authenticate, tenantMiddleware(), userController.deleteUser);

export default userRouter;
