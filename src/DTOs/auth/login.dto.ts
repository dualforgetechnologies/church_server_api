import { z } from 'zod';

export const loginDto = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    mfaCode: z.string().min(4).max(10).optional(),
});

export type LoginDto = z.infer<typeof loginDto>;
