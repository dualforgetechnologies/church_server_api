import { User } from '@prisma/client';

interface UserAccountResponse extends Omit<User, 'password'> {}

type SanitizeAccount = Partial<UserAccountResponse>;

type AccountType = 'USER' | 'CUSTOMER';
interface JwtPayload {
    sub: string;
    email: string;
    role?: string;
    type: AccountType;
}
interface VerifyAccountJwtPayload extends JwtPayload {
    isNew: boolean;
}
interface ResetPasswordJwtPayload extends JwtPayload {
    hasForgotPass: boolean;
}
type JwtPayloadT = JwtPayload | VerifyAccountJwtPayload | ResetPasswordJwtPayload;

export type {
    UserAccountResponse,
    SanitizeAccount,
    AccountType,
    JwtPayload,
    VerifyAccountJwtPayload,
    ResetPasswordJwtPayload,
    JwtPayloadT,
};

export enum Gender {
    male = 'male',
    female = 'female',
    other = 'other',
}
