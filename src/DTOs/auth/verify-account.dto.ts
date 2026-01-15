import { z } from 'zod';
export const verifyAccountDto = z.object({
    token: z.string().min(10, 'token must be at least 10 characters long'),
});

export type VerifyAccountDto = z.infer<typeof verifyAccountDto>;
