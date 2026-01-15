import { z } from 'zod';
export const loginOutDto = z.object({
    refreshToken: z.string().min(10, 'Refresh token must be at least 10 characters long'),
});

export type LoginOutDto = z.infer<typeof loginOutDto>;
