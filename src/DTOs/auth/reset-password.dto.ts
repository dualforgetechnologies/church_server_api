import { z } from 'zod';

export const resetPasswordDto = z
    .object({
        newPassword: z.string().min(6, { message: 'New password must be at least 6 characters' }),
        confirmPassword: z.string().min(6, { message: 'Confirm password must be at least 6 characters' }),
        token: z.string().min(10, { message: 'Token must be at least 10 characters long' }),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    });

export type ResetPasswordDto = z.infer<typeof resetPasswordDto>;
