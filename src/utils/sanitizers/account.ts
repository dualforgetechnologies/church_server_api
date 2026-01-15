import { SanitizeAccount } from '@/types/account';
import { User } from '@prisma/client';

export const sanitizeAccount = (account: Partial<User>): SanitizeAccount => {
    const { passwordHash, ...rest } = account;
    return rest;
};
