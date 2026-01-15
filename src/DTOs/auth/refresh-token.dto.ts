import { z } from 'zod';
export const refreshTokenDto = z.object({
    refreshToken: z.string().min(10, 'Refresh token must be at least 10 characters long'),
});

export type RefreshTokenDto = z.infer<typeof refreshTokenDto>;
