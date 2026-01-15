import { authController } from '@/controllers/user-management/auth.controller';
import { authJWT } from '@/middleware/auth.middleware';
import { validateBodyDto } from '@/middleware/validate-dto.middleware';
import express from 'express';

import { loginDto, refreshTokenDto, resetPasswordDto } from '@/DTOs/auth';
import { forgotPasswordDto } from '@/DTOs/auth/forget-password.dto';
import { verifyAccountDto } from '@/DTOs/auth/verify-account.dto';
import { changePasswordDto } from '@/DTOs/user';

const authRouter = express.Router();

authRouter.post('/login', validateBodyDto(loginDto), authController.login);

authRouter.post('/refresh-token', validateBodyDto(refreshTokenDto), authController.refreshToken);

authRouter.post('/logout', authJWT.authenticate, authController.logout);

authRouter.post('/forgot-password', validateBodyDto(forgotPasswordDto), authController.requestPasswordReset);

authRouter.post('/reset-password', validateBodyDto(resetPasswordDto), authController.resetPassword);

authRouter.post(
    '/change-password',
    authJWT.authenticate,
    validateBodyDto(changePasswordDto),
    authController.changePassword,
);

/**
 * Social login
 */
authRouter.post(
    '/social-login',
    authJWT.authenticate, // optional depending on your social login flow
    authController.socialLogin,
);

/**
 * Verify user account
 */
authRouter.post('/verify-account', validateBodyDto(verifyAccountDto), authController.verifyAccount);

authRouter.get('/me', authJWT.authenticate, authController.getProfile);

export default authRouter;
