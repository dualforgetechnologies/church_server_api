import { z } from 'zod';

export const forgotPasswordDto = z.object({
    email: z.string().email(),
});

export type ForgotPasswordDto = z.infer<typeof forgotPasswordDto>;
